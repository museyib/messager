import Title from "./TitleFragment.jsx";
import React, {useEffect, useState} from "react";
import ToggleTheme from "./ToggleThemeFragment.jsx";
import axiosInstance from "../api/auth.js";
import Info from "./InfoFragment.jsx";
import {useNavigate} from "react-router";

export default function UserInfo() {
    const navigate = useNavigate();
    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);
    const [user, setUser] = useState({
        id: '',
        username: '',
        email: '',
        phone: ''
    })

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const username = searchParams.get('username');
        console.log(username);
        axiosInstance.get('/user/overview?username=' + username, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        }).then((response) => {
            console.log(response);
            setUser(response.data.data);
        }).catch((error) => {
            showInfo({
                success: false,
                message: error.response.data.message,
            })
        })
    }, [])


    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
    }

    const handleBack = () => {
        navigate('/chat');
    }

    return (

        <div className='settings-container'>
            <link rel='stylesheet' href={'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'}/>
            <Title />
            <span id='back' onClick={handleBack} className='fas fa-arrow-left'></span>
            <span>Username: {user.username}</span>
            <span>Email: {user.email}</span>
            <span>Phone: {user.phone}</span>
            <ToggleTheme />
            <Info info={info} key={infoKey}/>
        </div>
    )
}