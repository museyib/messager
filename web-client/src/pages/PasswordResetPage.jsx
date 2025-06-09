import Title from "./TitleFragment.jsx";
import React, {useEffect, useState} from "react";
import Info from "./InfoFragment.jsx";
import ToggleTheme from "./ToggleThemeFragment.jsx";
import axiosInstance from "../api/auth.js";
import {useNavigate, useSearchParams} from "react-router";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();

    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "password") {
            setPassword(value);
        }
        else if (name === "passwordConfirm") {
            setPasswordConfirm(value);
        }
    }

    const handleReset = (e) => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            showInfo( {
                success: false,
                message: 'Passwords do not match.'
            });
            return;
        }

        const token = searchParams.get("token");
        if (token) {
            axiosInstance.post(`/user/reset-password`, {
                token: token,
                password: password,
            }).then((res) => {
                showInfo({
                    success: true,
                    message: res.data.message,
                })
                setTimeout(()=> navigate("/login"), 2000);
            }).catch((error) => {
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
            <h2 className='subtitle'>Reset password</h2>

            <form onSubmit={handleReset}>
                <div>
                    <label htmlFor='password'>Password</label>
                    <input
                        id='password'
                        type='password'
                        name='password'
                        value={password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor='passwordConfirm'>Password (Repeat)</label>
                    <input
                        id='passwordConfirm'
                        type='password'
                        name='passwordConfirm'
                        value={passwordConfirm}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <input type='submit' className='btn' value='Reset password' />
                </div>
            </form>

            <Info info={info} key={infoKey}/>

            <ToggleTheme />
        </div>
    )
}