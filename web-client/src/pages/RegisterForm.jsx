import React, {useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import axiosInstance from '../api/auth.js';
import {checkForExistence} from '../api/users.js';
import ToggleTheme from './ToggleThemeFragment.jsx';
import Info from './InfoFragment.jsx';
import Title from "./TitleFragment.jsx";

export default function Register() {
    const [formReady, setFormReady] = useState(false);
    const navigate = useNavigate();
    const debounceTimer = useRef(null);
    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        phone: '',
    });

    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'username' || name === 'phone' || name === 'email') {

            clearTimeout(debounceTimer.current);
            document.getElementById(name).classList.remove('input-invalid');
            debounceTimer.current = setTimeout(() => {
                checkForExistence(name, value).then(() => {
                    setFormReady(document.getElementsByClassName('input-invalid').length === 0)
                }).catch((error) => {
                    document.getElementById(name).classList.add('input-invalid');
                    showInfo( {
                        success: false,
                        message: error.message,
                    })
                })
            }, 1000);
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = (e) => {
        e.preventDefault();

        navigate('/login')
    };

    const handleRegister =  (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password || !formData.email || !formData.phone) {
            showInfo({
                success: false,
                message: 'All fields are required'
            });
            return;
        }

        if (!formReady) {
            showInfo( {
                success: false,
                message: 'Check your input data and retry.'
            });
            return;
        }

        axiosInstance.post('/user/create', formData).then((response) => {
            if (response.status === 200) {
                showInfo({
                    success: true,
                    message: 'Registration is successful. We sent verification code to your email. Please verify your account.'
                });
                localStorage.setItem('email', formData.email);
                setTimeout(() => navigate('/verify'), 2000);
            }
        }).catch((error) => {
            showInfo({
                success: false,
                message: 'Registration failed: ' + error.response.data.message
            });
        });
    }
    return (
        <div className='home-container'>
            <Title />
            <h2 className='subtitle'>Register</h2>

            <form onSubmit={handleRegister} className='space-y-4'>
                <div>
                    <label htmlFor='email'>Email</label>
                    <input
                        id='email'
                        type='email'
                        name='email'
                        value={formData.email}
                        autoComplete='email'
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor='username'>Username</label>
                    <input
                        id='username'
                        type='text'
                        name='username'
                        value={formData.username}
                        autoComplete='username'
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor='phone'>Phone</label>
                    <input
                        id='phone'
                        type='text'
                        name='phone'
                        value={formData.phone}
                        autoComplete='phone'
                        onChange={handleChange}
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
                    />
                </div>
                <input type='submit' className='btn' value='Register'/>
                <h6>Or <span onClick={handleLogin} className='link-btn'>Login</span></h6>
            </form>

            <Info info={info} key={infoKey}/>

            <ToggleTheme />
        </div>
    );
}
