import React, {useEffect, useState} from 'react';
import axiosInstance from '../api/auth.js';
import {useNavigate} from 'react-router';
import ToggleTheme from './ToggleThemeFragment.jsx';
import Info from './InfoFragment.jsx';
import Title from "./TitleFragment.jsx";

export default function Verify() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);

    useEffect(() => {
        setEmail(localStorage.getItem('email'));
    }, []);

    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
    }

    const handleChange = (e) => {
        e.preventDefault();
        const {name, value} = e.target;
        if (name === 'email') {
            setEmail(value);
        }
        else if (name === 'verificationCode') {
            setVerificationCode(value);
        }
    }

    const handleVerify = (e) => {
        e.preventDefault();

        if (email) {
            axiosInstance.post('/user/verify?code=' + verificationCode + '&email=' + email).then((response) => {
                console.log(response);
                showInfo({
                    success: true,
                    message: 'Verification code was successfully verified. You can log in now.',
                })
                setTimeout(() => navigate('/login'), 1000);

            }).catch((error) => {
                console.log(error);
                showInfo({
                    success: false,
                    message: error.response.data.message,
                })
            })
        }
    }

    return (
        <div className='home-container'>
            <Title />
            <h2 className='subtitle'>Verify your account</h2>

            <form onSubmit={handleVerify} className='space-y-4'>
                <div>
                    <label htmlFor='email'>E-mail</label>
                    <input id='email'
                           type='text'
                           name='email'
                           value={email}
                           placeholder='Enter e-mail address'
                           autoComplete='email'
                           onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor='verificationCode'>Verification code</label>
                        <input id='verificationCode'
                               type='text'
                               name='verificationCode'
                               value={verificationCode}
                               placeholder='Enter verification code'
                               onChange={handleChange} />
                </div>
                <div>
                    <input type='submit' className='btn' value='Verify' />
                </div>
            </form>

            <Info info={info} key={infoKey}/>

            <ToggleTheme />
        </div>
    )
}