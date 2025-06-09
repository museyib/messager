import Title from "./TitleFragment.jsx";
import React, {useEffect, useState} from "react";
import Info from "./InfoFragment.jsx";
import ToggleTheme from "./ToggleThemeFragment.jsx";
import axiosInstance from "../api/auth.js";

export default function SendPasswordResetRequest() {
    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);
    const [email, setEmail] = useState("");

    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
    }

    const handleChange = (e) => {
        setEmail(e.target.value);
    }

    const handleReset = (e) => {
        e.preventDefault();

        if (email) {
            axiosInstance.post(`/user/send-password-reset-request?email=${email}`).then((res) => {
                showInfo({
                    success: true,
                    message: res.data.message,
                })
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
                    <input type='submit' className='btn' value='Send request' />
                </div>
            </form>

            <Info info={info} key={infoKey}/>

            <ToggleTheme />
        </div>
    )
}