import React, {useEffect, useState} from "react";


export default function ToggleTheme() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            setDarkMode(true);
            document.body.classList.add("dark");
        }
    }, []);

    const toggleTheme = () => {
        if (darkMode) {
            document.body.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
        else {
            document.body.classList.add("dark");
            localStorage.setItem("theme", "dark");
        }

        setDarkMode(!darkMode);
    }

    return (
        <div className="theme-toggle">
            <label className="switch">
                <input type="checkbox" name="toggle-theme" checked={darkMode} onChange={toggleTheme} />
                <span className="slider"></span>
            </label>
        </div>
    )
}