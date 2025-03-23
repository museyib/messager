import React from "react";
import {useNavigate} from "react-router";

export default function Title() {
    const navigate = useNavigate();

    const handleClick = (e) => {
        e.preventDefault();
        navigate("/");
    }

    return (
        <h2 className='app-title' onClick={handleClick}>Messager</h2>
    )
}