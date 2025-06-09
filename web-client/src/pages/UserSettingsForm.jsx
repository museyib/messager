import React, {useEffect, useRef, useState} from "react";
import {checkForExistence, getByUsername} from "../api/users.js";
import Title from "./TitleFragment.jsx";
import Info from "./InfoFragment.jsx";
import ToggleTheme from "./ToggleThemeFragment.jsx";
import axiosInstance, {logout, refreshToken} from "../api/auth.js";
import {useNavigate} from "react-router";

export default function UserSettings() {
    const navigate = useNavigate();
    const debounceTimer = useRef(null);
    const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
    const [formReady, setFormReady] = useState(true);
    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        allowReceiveMessage: false,
        showContactInformation: false,
        showReadReceipt: false,
        showOnlineStatus: false,

    });
    const [fieldRequirePrompted, setFieldRequirePrompted] = useState(false);

    useEffect(() => {
        const username = localStorage.getItem('username');

        getByUsername(username).then(response => {
            if (response.success && response.data) {
                const userData = response.data;
                setFormData({
                    id: userData.id,
                    username: userData.username || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    allowReceiveMessage: userData.allowReceiveMessage || false,
                    showContactInformation: userData.showContactInformation || false,
                    showReadReceipt: userData.showReadReceipt || false,
                    showOnlineStatus: userData.showOnlineStatus || false,
                });
            }
            else {
                showInfo({
                    success: false,
                    message: 'Not found any user for this phone.'
                })
            }
        })
    }, []);

    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
        setFieldRequirePrompted(!info.success)
    }

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        if (name === "currentPassword") {
            setCurrentPassword(value);
        }
        if (name === "newPassword") {
            setNewPassword(value);
        }
        else if (name === "newPasswordConfirm") {
            setNewPasswordConfirm(value);
        }
    }

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
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
        if (type === 'checkbox')
            setFormData((prev) => ({...prev, [name]: checked}));
        else
            setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!formData.username || !formData.email || !formData.phone) {
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
        const token = localStorage.getItem('token');

        axiosInstance.patch('/user/update', formData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(() => {
            localStorage.setItem('username', formData.username);
            refreshToken().catch(() => logout());
            showInfo({
                success: true,
                message: 'Changes saved successfully.',
            });
        }).catch(error => {
            showInfo({
                success: false,
                message: error.response.data.message,
            });
        });
    }

    const handleSavePassword = (e) => {
        e.preventDefault();
        if (newPassword !== newPasswordConfirm) {
            showInfo({
                success: false,
                message: 'Passwords do not match!',
            })
        } else if (newPassword === currentPassword) {
            showInfo({
                success: false,
                message: 'New password must differ than current password!',
            })
        } else {
            const username = localStorage.getItem('username');
            const token = localStorage.getItem('token');
            axiosInstance.post('/user/change-password', {
                username: username,
                currentPassword: currentPassword,
                newPassword: newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then((response) => {
                showInfo({
                    success: true,
                    message: response.data.message,
                })
            }).catch(error => {
                showInfo({
                    success: false,
                    message: error.response.data.message,
                })
            })
        }
    }

    const handleBack = () => {
        navigate('/chat');
    }

    return (
        <div className='settings-container'>
            <link rel='stylesheet' href={'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'}/>
            <Title />

            <span id='back' onClick={handleBack} className='fas fa-arrow-left'></span>
            <div>
                <p className='link-btn' onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}>
                    {!showChangePasswordForm ? 'Change Password' : 'Edit User Settings'}
                </p>
                <div className={showChangePasswordForm ? '' : 'hidden'}>
                    <form onSubmit={handleSavePassword} className='space-y-4'>
                        <div>
                            <label htmlFor='currentPassword'>Current Password</label>
                            <input
                                id='currentPassword'
                                type='password'
                                name='currentPassword'
                                value={currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor='newPassword'>New Password</label>
                            <input
                                id='newPassword'
                                type='password'
                                name='newPassword'
                                value={newPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor='newPasswordConfirm'>New Password (Repeat)</label>
                            <input
                                id='newPasswordConfirm'
                                type='password'
                                name='newPasswordConfirm'
                                value={newPasswordConfirm}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div>
                            <input type='submit' className='btn' value='Change password' />
                        </div>
                    </form>
                </div>
            </div>
            <form onSubmit={handleSave} className={`space-y-4 ${!showChangePasswordForm? '' : 'hidden'}`}>
                <div>
                    <label htmlFor='email'>Email</label>
                    <input
                        id='email'
                        type='email'
                        name='email'
                        value={formData.email}
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
                        onChange={handleChange}
                        className={(fieldRequirePrompted && !formData.username) ? 'input-invalid' : ''}
                    />
                </div>
                <div>
                    <label htmlFor='phone'>Phone</label>
                    <input
                        id='phone'
                        type='text'
                        name='phone'
                        value={formData.phone}
                        onChange={handleChange}
                        className={(fieldRequirePrompted && !formData.phone) ? 'input-invalid' : ''}
                    />
                </div>
                <div>
                    <label htmlFor='allowReceiveMessage'>Allow Receive Message</label>
                    <input id='allowReceiveMessage'
                           type='checkbox'
                           name='allowReceiveMessage'
                           checked={formData.allowReceiveMessage}
                           onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor='showContactInformation'>Show Contact Information</label>
                    <input id='showContactInformation'
                           type='checkbox'
                           name='showContactInformation'
                           checked={formData.showContactInformation}
                           onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor='showReadReceipt'>Show Read Receipt</label>
                    <input id='showReadReceipt'
                           type='checkbox'
                           name='showReadReceipt'
                           checked={formData.showReadReceipt}
                           onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor='showOnlineStatus'>Show Online Status</label>
                    <input id='showOnlineStatus'
                           type='checkbox'
                           name='showOnlineStatus'
                           checked={formData.showOnlineStatus}
                           onChange={handleChange}
                    />
                </div>
                <input type='submit' className='btn' value='Save'/>
            </form>

            <Info info={info} key={infoKey}/>

            <ToggleTheme />
        </div>
    )
}