import {useNavigate} from "react-router";
import "../../app/app.css";
import React, {useEffect} from "react";
import ToggleTheme from "./ToggleThemeFragment.jsx";
import Title from "./TitleFragment.jsx";

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        const logStatus = localStorage.getItem("logStatus");
        if (logStatus) {
            navigate("/chat");
        }
    }, [])

    return (
        <div className="home-container">
            <Title />
            <div className="button-group">
                <button className="btn login" onClick={() => navigate("/login")}>Login</button>
                <button className="btn register" onClick={() => navigate("/register")}>Register</button>
            </div>

            <ToggleTheme />
        </div>
    );
}