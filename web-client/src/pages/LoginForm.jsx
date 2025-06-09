import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router';
import axiosInstance from '../api/auth.js';
import ToggleTheme from './ToggleThemeFragment.jsx';
import Info from './InfoFragment.jsx';
import Title from "./TitleFragment.jsx";

export default function Login() {
    const [info, setInfo] = useState(null);
    const [fieldRequirePrompted, setFieldRequirePrompted] = useState(false);
    const [infoKey, setInfoKey] = useState(0);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        setFormData({
            username: '',
            password: '',
        })
    }, []);

    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
        setFieldRequirePrompted(!info.success)
    }

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handleLogin = (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            showInfo({
                success: false,
                message: 'All fields are required!'
            });
            return;
        }

        axiosInstance.post('/auth/token', formData).then((response) => {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('username', formData.username);
            localStorage.setItem('password', formData.password);
            localStorage.setItem("logStatus", true);
            showInfo({
                success: true,
                message: 'Login is successful. You will be redirected to chat page now.'
            });
            setTimeout(() => navigate('/chat'), 1000);
        }).catch((error) => {
            showInfo({
                success: false,
                message: 'Login failed: ' + error.response.data.message
            })
        });
    };

    const handleRegister = (e) => {
        e.preventDefault();
        navigate('/register');
    }

    const handleResetPassword = (e) => {
        e.preventDefault();
        navigate('/send-password-reset-request');
    }

    return (
        <div className='home-container'>
            <Title/>
            <h2 className='subtitle'>Login</h2>

            <form onSubmit={handleLogin} className='space-y-4'>
                <div>
                    <label htmlFor='username'>Username</label>
                    <input
                        id='username'
                        type='text'
                        name='username'
                        value={formData.username}
                        autoComplete='username'
                        onChange={handleChange}
                        className={(fieldRequirePrompted && !formData.username) ? 'input-invalid' : ''}
                    />
                </div>
                <div>
                    <label htmlFor='password'>Password</label>
                    <input
                        id='password'
                        type='password'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        className={(fieldRequirePrompted && !formData.password) ? 'input-invalid' : ''}
                    />
                </div>
                <input type='submit' className='btn' value='Login'/>
                <h6>Or create new account: <span onClick={handleRegister} className='link-btn'>Register</span></h6>
                <h6><span onClick={handleResetPassword} className='link-btn'>Forgot password?</span></h6>
            </form>

            <Info info={info} key={infoKey}/>

            <ToggleTheme/>
        </div>
    );
}
