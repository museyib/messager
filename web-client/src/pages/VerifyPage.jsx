import React, {useEffect, useState} from 'react';
import axiosInstance from '../api/auth.js';
import {useNavigate} from 'react-router';
import ToggleTheme from './ToggleThemeFragment.jsx';
import Info from './InfoFragment.jsx';
import Title from "./TitleFragment.jsx";
import {VERIFICATION_TIMEOUT_SECONDS} from "../api/constants.js";

const useCountDownTimer = (initialTime) => {
    const [countDown, setCountDown] = useState(initialTime);

    useEffect(() => {
        const storedTime = localStorage.getItem('verificationCountDown');
        if (storedTime) {
            setCountDown(Number(storedTime));
        }
    }, []);

    useEffect(() => {
        if (countDown > 0) {
            const interval = setInterval(() => {
                const newCountDown = countDown - 1;
                setCountDown(newCountDown);
                localStorage.setItem('verificationCountDown', newCountDown.toString());
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [countDown]);

    const restartTimer = () => {
        setCountDown(VERIFICATION_TIMEOUT_SECONDS);
        localStorage.setItem('verificationCountDown', VERIFICATION_TIMEOUT_SECONDS.toString());
    }

    return {countDown, restartTimer};
}

export default function Verify() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);
    const {countDown, restartTimer} = useCountDownTimer(VERIFICATION_TIMEOUT_SECONDS);

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
            axiosInstance.post('/user/verify', {
                code: verificationCode,
                email: email,
                timeoutSeconds: VERIFICATION_TIMEOUT_SECONDS
            }).then(() => {
                showInfo({
                    success: true,
                    message: 'Verification code was successfully verified. You can log in now.',
                })
                setTimeout(() => navigate('/login'), 1000);

            }).catch((error) => {
                showInfo({
                    success: false,
                    message: error.response.data.message,
                })
                if (error.status === 410) {
                    restartTimer();
                }
            })
        }
    }

    return (
        <div className='home-container'>
            <Title />
            <h2 className='subtitle'>Verify your account</h2>
            <h1>{`${Math.floor(countDown/60)}:${countDown%60}`}</h1>

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