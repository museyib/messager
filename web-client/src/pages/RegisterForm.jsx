import React, {useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import axiosInstance from '../api/auth.js';
import {checkForExistence} from '../api/users.js';
import ToggleTheme from './ToggleThemeFragment.jsx';
import Info from './InfoFragment.jsx';
import Title from "./TitleFragment.jsx";
import PhoneInput from "react-phone-number-input/mobile";
import 'react-phone-number-input/style.css'
import {VERIFICATION_TIMEOUT_SECONDS} from "../api/constants.js";

export default function Register() {
    const [formReady, setFormReady] = useState(true);
    const [fieldRequirePrompted, setFieldRequirePrompted] = useState(false);
    const navigate = useNavigate();
    const debounceTimer = useRef(null);
    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        password_r: '',
        verificationTimeoutSeconds: VERIFICATION_TIMEOUT_SECONDS
    });

    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
        setFieldRequirePrompted(!info.success)
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        validateUniqueness(name, value);
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (value) => {
        validateUniqueness("phone", value);
        setFormData((prev) => ({...prev, phone: value}));
    }

    const validateUniqueness = (name, value) => {
        if (name === 'username' || name === 'phone' || name === 'email') {
            clearTimeout(debounceTimer.current);
            document.getElementById(name).classList.remove('input-invalid');
            debounceTimer.current = setTimeout(() => {
                checkForExistence(name, value).then((response) => {
                    if (response.data) {
                        console.error(response.message)
                        document.getElementById(name).classList.add('input-invalid');
                        showInfo( {
                            success: false,
                            message: response.message,
                        })

                    }
                    else
                        setFormReady(document.getElementsByClassName('input-invalid').length === 0)
                }).catch((error) => {
                    console.error(error)
                    showInfo( {
                        success: false,
                        message: error.message,
                    })
                })
            }, 1000);
        }
    }

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

        if (formData.password !== formData.password_r) {
            showInfo( {
                success: false,
                message: 'Passwords do not match.'
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
                message: 'Registration failed: ' + error
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
                        className={(fieldRequirePrompted && !formData.email) ? 'input-invalid' : ''}
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
                        className={(fieldRequirePrompted && !formData.username) ? 'input-invalid' : ''}
                    />
                </div>
                <div>
                    <label htmlFor='phone'>Phone</label>
                    <PhoneInput
                        id='phone'
                        name='phone'
                        onChange={handlePhoneChange}
                        value={formData.phone}
                        international={true}
                        defaultCountry={"AZ"}
                        withCountryCallingCode={true}
                        countryCallingCodeEditable={false}
                        className ={`react-phone-number-input ${(fieldRequirePrompted && !formData.username) ? 'input-invalid' : ''}`}/>
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
                <div>
                    <label htmlFor='password_r'>Password (Repeat)</label>
                    <input
                        id='password_r'
                        type='password'
                        name='password_r'
                        value={formData.password_r}
                        onChange={handleChange}
                        className={(fieldRequirePrompted && !formData.password_r) ? 'input-invalid' : ''}
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
