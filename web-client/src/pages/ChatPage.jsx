import React, {Suspense, useEffect, useRef, useState} from 'react';
import {getMessagesByRecipient, getUnreadMessagesByUsername} from '../api/messages.js';
import {getActiveChats, getByPhone} from '../api/users.js';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import ToggleTheme from './ToggleThemeFragment.jsx';
import Info from './InfoFragment.jsx';
import Title from "./TitleFragment.jsx";
import {logout} from "../api/auth.js";
import EmojiPicker, {Theme} from "emoji-picker-react";
import {Link, useNavigate} from "react-router";
import PhoneInput from "react-phone-number-input/mobile";
import 'react-phone-number-input/style.css'

export default function Chat () {
    const navigate = useNavigate();
    const [isClient, setIsClient] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [username, setUsername] = useState('');
    const [recipient, setRecipient] = useState({});
    const [messageText, setMessageText] = useState('');
    const [lastError, setLastError] = useState('');
    const [phoneToSearch, setPhoneToSearch] = useState('');
    const [userStatus, setUserStatus] = useState('');
    const [emojiPickerPosition, setEmojiPickerPosition] = useState({});

    const [now, setNow] = useState(Date.now());

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);

    const [info, setInfo] = useState(null);
    const [infoKey, setInfoKey] = useState(0);

    const [unreadMessages, setUnreadMessages] = useState({});

    const messageListRef = useRef(null);
    const messageEndRef = useRef(null);
    const clientRef = useRef(null);
    const observerRef = useRef(null);
    const messageSubscriptionRef = useRef(null);
    const inputRef = useRef(null);
    const statusSubscriptionRef = useRef(null);

    const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

    useEffect(() => {
        setIsClient(true);
        const storedUsername = localStorage.getItem('username');
        if (storedUsername)
            setUsername(storedUsername);
        else
            logout();

        setWindowWidth(window.innerWidth);

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        }

        fetchUsers();

        fetchUnreadMessages()

        window.addEventListener('scroll', markMessagesAsRead);
        window.addEventListener('resize', handleResize);

        const interval = setInterval(() => {
            setNow(Date.now());
        }, 5000);

        return () => {
            window.removeEventListener('scroll', markMessagesAsRead);
            window.removeEventListener('resize', handleResize);
            clearInterval(interval);
        }

    }, []);

    useEffect(() => {
        setDarkMode(localStorage.getItem("theme") === "dark");
    });

    useEffect(() => {
        window.addEventListener('keydown', handleEscapePress);

        return () => {
            window.removeEventListener('keydown', handleEscapePress);
        }
    }, [emojiPickerVisible])

    useEffect(() => {
        const timeoutDelay = Math.max(1000, users.length * 100);
        setTimeout(() => {
            users.forEach((user) => {
                sendDeliveredReceiptBulk(user.username);
            })
        }, timeoutDelay);
    }, [users]);

    useEffect(() => {
        setEmojiPickerVisible(false);
        setMessageText('');
        fetchMessages(recipient.username);

        setTimeout(() =>{
            scrollToFirstUnread()
        }, 500);

        document.getElementById('message').focus({
            preventScroll: true,
        })
    }, [recipient]);

    useEffect(() => {
        if (!clientRef.current && username) {
            const token = localStorage.getItem('token');
            const socket = new SockJS(BASE_API_URL + `/ws?token=${token}`);
            const stompClient = new Client({
                webSocketFactory: () => socket,
                onConnect: () => {
                    sendStatus('online', true);
                    subscribeToMessages(username, recipient);
                    subscribeToStatusChange(recipient);

                    clientRef.current?.subscribe(`/chat/${username}/deliver/message`, (message) => {
                        const readMessage = JSON.parse(message.body);
                        setMessages((prevMessages) =>
                            prevMessages.map(msg =>
                                msg.clientId === readMessage.clientId ? { ...msg, deliveredAt: readMessage.deliveredAt } : msg
                            )
                        );
                    });

                    clientRef.current?.subscribe(`/chat/${username}/deliver/messages`, (message) => {
                        const deliveredAt = message.body;
                        setMessages((prevMessages) =>
                            prevMessages.map(msg =>
                                (!msg.deliveredAt) ? { ...msg, deliveredAt: deliveredAt } : msg
                            )
                        );
                    });

                    clientRef.current?.subscribe(`/chat/${username}/read/messages`, (message) => {
                        const readMessage = JSON.parse(message.body);
                        setMessages((prevMessages) =>
                            prevMessages.map(msg =>
                                msg.clientId === readMessage.clientId ? { ...msg, readAt: readMessage.readAt } : msg
                            )
                        );
                    });
                }
            });
            stompClient.activate();
            clientRef.current = stompClient;
        }
        else {
            subscribeToMessages(username, recipient);
            subscribeToStatusChange(recipient);
        }

        return () => {
            messageSubscriptionRef.current?.unsubscribe();
            statusSubscriptionRef.current?.unsubscribe();
        };
    }, [username, recipient]);

    useEffect(() => {
        if (isUserAtBottom()) scrollToBottom();
    }, [messages]);

    const subscribeToMessages = (username, recipient) => {
        messageSubscriptionRef.current?.unsubscribe();

        messageSubscriptionRef.current = clientRef.current?.subscribe(`/chat/${username}/queue/messages`, (message) => {
            const newMessage = JSON.parse(message.body);
            if (recipient.username === newMessage.sender) {
                setMessages((prev) => [...prev, newMessage]);
                setTimeout(markMessagesAsRead, 300);
                if (isUserAtBottom()) setTimeout(scrollToBottom, 50);
            } else {
                processUnreadMessage(newMessage);
                sendDeliveredReceiptWithRetry(newMessage.clientId);
            }
        });
    }

    const subscribeToStatusChange = (recipient) => {
        statusSubscriptionRef.current?.unsubscribe();

        statusSubscriptionRef.current = clientRef.current?.subscribe(`/status`, (message) => {
            const statusInfo = JSON.parse(message.body);
            if (statusInfo) {
                setUsers((prevUsers= []) => {
                    return prevUsers.map((user) => {
                        if (user.username === statusInfo.username) {
                            return {...user, status: statusInfo.status };
                        }
                        return user;
                    });
                });

                if (statusInfo.username === recipient.username) {
                    setUserStatus(statusInfo.status);
                }
            }
        });
    }

    const sendStatus = (status, isOnline) => {
        const storedUsername = localStorage.getItem('username');

        if (clientRef.current && clientRef.current.connected)
            clientRef.current.publish({
                destination: '/app/send-status',
                body: JSON.stringify({
                    username: storedUsername,
                    status: status,
                    isOnline: isOnline,
                })
        })
    }

    const toggleEmojiPicker = (e) => {
        e.preventDefault();
        if (!emojiPickerVisible)
            setEmojiPickerPosition({
                left: e.clientX
            });
        setEmojiPickerVisible((prev) => !prev);
    }

    const handleEmojiSelected = (emoji) => {
        const inputElement = inputRef.current;
        const caretPosition = inputElement.selectionStart;
        setMessageText((prev) => {
            const head = prev.substring(0, caretPosition);
            const tail = prev.substring(caretPosition);
            return head + emoji.emoji + tail;
        });

        requestAnimationFrame(() => {
            inputElement.setSelectionRange(caretPosition + emoji.emoji.length, caretPosition + emoji.emoji.length);
        })
    }

    const isUserAtBottom = () => {
        const messageContainer = document.getElementById('main-content-container');
        return messageContainer.scrollHeight - messageContainer.scrollTop <= messageContainer.clientHeight + 5;
    }

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    const scrollToFirstUnread = () => {
        const firstUnread = document.querySelector('.message-item.unread');
        if (firstUnread) {
            firstUnread.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            setTimeout(() => {
                markMessagesAsRead();
            }, 200);
        }
        else
            focusOnLastMessage();
    }

    const showInfo = (info) => {
        setInfo(info);
        setInfoKey((prev) => prev + 1);
    }

    const focusOnLastMessage = () => {
        if (messageListRef.current)
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }

    const fetchUsers = () => {
        getActiveChats().then((response) => {
            if (response.success) {
                setLastError('')
                setUsers(response.data);
            }
            else {
                if (response.message !== lastError) {
                    console.error(response.message);
                    showInfo(response);
                    setLastError(response.message);
                }
            }
        }).catch((error) => {
            if (error.message !== lastError) {
                console.error(error.message);
                setLastError(error.message);
            }
            showInfo({
                success: false,
                message: 'Failed to fetch users. Check your connection and try refreshing the page.'
            });
        });
    }

    const fetchMessages = (recipient) => {
        if (!username || !recipient) {
            setMessages([])
            return;
        }

        getMessagesByRecipient(username, recipient).then((response) => {
            if (response.success) {
                setMessages(response.data.reverse());
            } else {
                if (response.message !== lastError) {
                    console.error(response.message);
                    showInfo({
                        success: false,
                        message: response.message
                    });
                    setLastError(response.message);
                }
            }
        }).catch((error) => {
            if (error.message !== lastError) {
                console.error(error.message);
                setLastError(error.message);
            }
            showInfo({
                success: false,
                message: 'Failed to fetch messages. Check your connection.'
            });
        });
    }

    const fetchUnreadMessages = () => {
        const storedUsername = localStorage.getItem('username');
        if (!storedUsername) return;

        getUnreadMessagesByUsername(storedUsername).then((response) => {
            if (response.success) {
                response.data.forEach((message) => {
                    processUnreadMessage(message);
                })
            }
            else {
                if (response.message !== lastError) {
                    console.error(response.message);
                    showInfo({
                        success: false,
                        message: response.message
                    });
                    setLastError(response.message);
                }
            }
        }).catch((error) => {
            if (error.message !== lastError) {
                console.error(error.message);
                setLastError(error.message);
            }
            showInfo({
                success: false,
                message: 'Failed to fetch messages. Check your connection.'
            });
        });
    }

    const processUnreadMessage = (newMessage) => {
        const newRecipient = {
            username: newMessage.sender,
        };

        setUsers((prevUsers) => {
            const isInActiveChats = prevUsers.some((user) => user.username === newRecipient.username);
            if (!isInActiveChats) {
                return [...prevUsers, newRecipient];
            }

            return prevUsers;
        })

        setUnreadMessages((prevUnreadMessages) => {
            return {...prevUnreadMessages, [newMessage.sender]: (prevUnreadMessages[newMessage.sender] || 0) + 1}
        })

        const userItem = document.getElementById(`user-${newMessage.sender}`);
        if (userItem) {
            userItem.classList.add('new-message-highlight');
            setTimeout(() => userItem.classList.remove('new-message-highlight'), 2000);
        }
    }

    const formatTimeAgo = (timeString) => {
        const sentTime =new Date(timeString.replace(' ', 'T'));
        const diffInSeconds = Math.floor((now - sentTime) / 1000);

        if (diffInSeconds < 5) return 'just now';
        else if (diffInSeconds < 60) {
            const dif = Math.floor(diffInSeconds);
            if (dif === 1)
                return `${dif} second ago`;
            else
                return `${dif} seconds ago`;
        }
        else if (diffInSeconds < 3600) {
            const dif = Math.floor(diffInSeconds / 60);
            if (dif === 1)
                return `${dif} minute ago`;
            else
                return `${dif} minutes ago`;
        }
        else if (diffInSeconds < 86400) {
            const dif = Math.floor(diffInSeconds / 3600);
            if (dif === 1)
                return `${dif} hour ago`;
            else
                return `${dif} hours ago`;
        }
        else if (diffInSeconds > 86400) {
            const dif = Math.floor(diffInSeconds / 86400);
            if (dif === 1)
                return `${dif} day ago`;
            else
                return `${dif} days ago`;
        }
        return timeString;
    }

    const handleMessageChange = (e) => {
        setMessageText(e.target.value);
    }

    const handleRecipientChange = (user) => {
        setRecipient(user);
        setUserStatus(user.status);
    }

    const handleRecipientChangeFromSelect = (e) => {
        e.preventDefault();
        let selectedUser;
        users.filter((user) => {
            if (user.username === e.target.value) {
                selectedUser = user;
                return true;
            }
        })
        setRecipient(selectedUser);
    }

    const handleBack = () => {
        setRecipient({
            username: '',
            status: ''
        })
    }

    const handleSendMessage = (e) => {
        const now = new Date();
        const timeStamp = '_' + now.getUTCFullYear() + now.getMonth() + now.getDate()
            + now.getHours() + now.getMinutes() + now.getSeconds() + now.getMilliseconds();
        const offset = now.getTimezoneOffset();
        const sentAt = new Date(now.getTime() - offset * 60000).toISOString().slice(0, 19);
        e.preventDefault();
        const messageData = {
            clientId: username + '_' + recipient.username + timeStamp,
            sender: username,
            receiver: recipient.username,
            message: messageText,
            sentAt: sentAt
        };

        if (!recipient) {
            alert('Please select a recipient');
            document.getElementById('users').focus();
            return;
        }

        if (!messageText.trim()) {
            alert('Please enter a message');
            document.getElementById('message').focus();
            return;
        }


        setMessages((prev) => [...prev, messageData]);
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination: '/app/send',
                body: JSON.stringify(messageData),
            })
            setMessageText('')
            setTimeout(scrollToBottom, 50);
        }
    }

    const sendDeliveredReceiptBulk = (recipient) => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername === recipient || !clientRef.current?.connected) return;
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination: '/app/set-delivered/messages',
                body: JSON.stringify({
                    sender: recipient,
                    receiver: storedUsername,
                }),
            });
        }
    }

    const sendDeliveredReceipt = (clientId) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination: '/app/set-delivered/message',
                body: clientId,
            });
        }
    }

    const sendDeliveredReceiptWithRetry = (clientId, retries = 5, delay = 500) => {
        try {
            sendDeliveredReceipt(clientId);
        } catch (error) {
            if (retries > 0)
                setTimeout(() => sendDeliveredReceiptWithRetry(clientId, retries - 1, delay), delay);
            else
                console.error('Failed to send deliver receipt after multiple retries.');
        }
    }

    const sendReadReceipt = (clientId) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination: '/app/read/message',
                body: clientId,
            });
        }
    }

    const markMessagesAsRead = () => {
        if (!recipient) return;

        const unreadMessages = document.querySelectorAll('.message-item.unread');

        if (!observerRef.current) {
            observerRef.current = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.remove('unread');
                        observerRef.current.unobserve(entry.target);
                        sendReadReceipt(entry.target.id)
                    }
                });
            }, {threshold: 0.8});
        }

        unreadMessages.forEach((message) => observerRef.current.observe(message));

        setUnreadMessages((prev) => ({
            ...prev,
            [recipient.username]: 0
        }));
    };

    const handleSearchPhoneChange = (value) => {
        setPhoneToSearch(value);
    }

    const handleSearchByPhone = (e) => {
        e.preventDefault();

        getByPhone(phoneToSearch).then(response => {
            if (response.success && response.data) {
                const newRecipient = response.data;
                if (!newRecipient.allowReceiveMessage) {
                    showInfo({
                        success: false,
                        message: 'This user does not receive any message currently.'
                    });
                    return;
                }
                const isInActiveChats = users.some((user) => user.username === newRecipient.username);
                setRecipient(newRecipient);
                setUserStatus(newRecipient.status);
                setPhoneToSearch('');
                if (!isInActiveChats) {
                    setUsers((prev) => [...prev, newRecipient]);
                }
            }
            else {
                showInfo({
                    success: false,
                    message: 'Not found any user for this phone.'
                })
            }
        });
    }

    const handleLogOut = () => {
        sendStatus('offline', false);
        if (clientRef.current) {
            if (clientRef.current.connected)
                clientRef.current.deactivate({
                    force: true,
                });
        }
        logout();
    }

    const handleEscapePress = (e) => {
        if (e.key === 'Escape') {
            if (emojiPickerVisible)
                setEmojiPickerVisible(false);
            else
                setRecipient({
                    username: '',
                    status: ''
                });
        }
    }

    const handleUserSettings = (e) => {
        e.preventDefault();
        navigate('/settings');
    }

    return (
        <div className='home-container'>
            <link rel='stylesheet' href={'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'}/>

            <Title />
            <h2 className='subtitle'>
                <i className='fas fa-user-circle'></i>
                You are logged in as <span className='user-title' onClick={handleUserSettings}>
                                        <u><strong>{username}</strong></u>
                                    </span>
                <p onClick={handleLogOut} className='link-btn'>Log out</p>
            </h2>
            <div className='search-container'>
                {(
                    <form onSubmit={handleSearchByPhone}>
                        <label htmlFor='phone-to-search'>Search by phone</label>
                        <PhoneInput id='phone-to-search'
                                    onFocus={() => setEmojiPickerVisible(false)}
                                    title='Search by phone'
                                    onChange={handleSearchPhoneChange}
                                    value={phoneToSearch}
                                    international={true}
                                    defaultCountry={"AZ"}
                                    withCountryCallingCode={true}
                                    countryCallingCodeEditable={false}
                                    className = 'react-phone-number-input'
                        />
                    </form>
                )}
            </div>
            <div className='user-list'>
                {windowWidth <= 768 ? (
                    <select value={recipient.username}
                            onChange={handleRecipientChangeFromSelect}
                            className={`dropdown ${recipient.username ? '' : 'not-selected'}`}
                    >
                        <option value=''>--not selected--</option>
                        {users.map((user, index) => (
                            <option key={index} id={'user-' + user.username}>
                                {user.username}
                                {unreadMessages[user.username] > 0 && (<span className='unread-badge'>{unreadMessages[user.username]}</span>)}
                            </option>
                        ))}
                    </select>
                ) : (
                    users.map((user, index) => (
                            <div key={index}
                                 id={'user-' + user.username}
                                 className={`user-item ${recipient.username === user.username ? 'selected' : ''}`}
                                 onClick={() => handleRecipientChange(user)}>
                                {user.username}
                                {unreadMessages[user.username] > 0 && (<span className='unread-badge'>{unreadMessages[user.username]}</span>)}
                            </div>
                    )))
                }
            </div>

            <div id='main-content-container'
                 className='main-content-container'
                 ref={messageListRef} >
                <div className={`selected-recipient-title ${recipient.username ? '' : 'hidden'}`}>
                    <span id='back' onClick={handleBack} className='fas fa-arrow-left'></span>
                    <Link to={`/user-info?username=${recipient.username}`}>
                        {recipient.username} <span className={`status-indicator ${userStatus}`}>{userStatus}</span>
                    </Link>

                </div>
                <ul id='message-list' className='message-list'>
                    {messages.map((message, index) => (
                        <li key={index}>
                            <div id={message.clientId}
                                 className={`message-item ${message.sender === username ? 'message-item-right' : 'message-item-left'} ${(!message.readAt && message.sender === recipient.username) ? 'unread' : ''}`}>
                                <span className={`message-item-menu ${message.sender === username ? 'message-item-menu-right' : 'message-item-menu-left'}`}>☰</span>
                                <div id={'menu_' + index} className='message-item-menu-list'>
                                    <ul>
                                        <li>Delete</li>
                                        <li>Edit</li>
                                    </ul>
                                </div>
                                {message.message}

                                <span className='message-item-footer' title={'Sent at: ' + message.sentAt}>
                                    {formatTimeAgo(message.sentAt)}
                                    <p className={`message-item-indicator ${message.readAt ? 'read' : 
                                        (message.deliveredAt ? 'delivered' : '')}`}
                                       title={'Delivered at: ' + message.deliveredAt + '; Read at: ' + message.readAt}>
                                        <i className={`fa ${(message.sender === username) ? 
                                            ((message.readAt || message.deliveredAt) ? 'fa-check-double' : 'fa-check') : ''}`}></i>
                                    </p>
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
                <div ref={messageEndRef}></div>
            </div>

            {isClient && (
                <div style={emojiPickerPosition}
                     className={`emoji-picker ${emojiPickerVisible ? '' : 'hidden'}`}>
                    <Suspense fallback={<div>Loading...</div>}>
                        <EmojiPicker theme={darkMode ? Theme.DARK : Theme.LIGHT} onEmojiClick={handleEmojiSelected} />
                    </Suspense>
                </div>
            )}

            <form onSubmit={handleSendMessage} className={'message-input-form ' + (recipient.username ? '' : 'hidden')}>
                <p className='fas fa-smile link-btn' onClick={toggleEmojiPicker}></p>
                <input id='message'
                       name='message'
                       value={messageText}
                       onChange={handleMessageChange}
                       type='text'
                       placeholder='Type your message'
                       autoComplete='off'
                       ref={inputRef}
                />
                <button type='submit' className='btn fas fa-paper-plane'></button>
            </form>

            <Info info={info} key={infoKey}/>

            <ToggleTheme />
        </div>
    )
}