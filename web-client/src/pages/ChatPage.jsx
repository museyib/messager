import React, {useEffect, useRef, useState} from 'react';
import {getMessagesByRecipient, getUnreadMessagesByUsername} from '../api/messages.js';
import {getActiveChats, getByPhone} from '../api/users.js';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {useNavigate} from 'react-router';
import ToggleTheme from './ToggleThemeFragment.jsx';
import Info from './InfoFragment.jsx';
import Title from "./TitleFragment.jsx";
import {logout} from "../api/auth.js";

export default function Chat () {
    useNavigate();
    const [username, setUsername] = useState('');
    const [recipient, setRecipient] = useState('');
    const [messageText, setMessageText] = useState('');
    const [lastError, setLastError] = useState('');
    const [phoneToSearch, setPhoneToSearch] = useState('');

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
    const subscriptionRef = useRef(null);

    const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername)
            setUsername(storedUsername);
        else
            logout();

        fetchUsers();

        fetchUnreadMessages()

        window.addEventListener('scroll', markMessagesAsRead);

        const interval = setInterval(() => {
            setNow(Date.now());
        }, 5000);

        return () => {
            window.removeEventListener('scroll', markMessagesAsRead);
            clearInterval(interval);
        }

    }, []);

    useEffect(() => {
        const timeoutDelay = Math.max(1000, users.length * 100);
        setTimeout(() => {
            users.forEach((user) => {
                sendDeliveredReceiptBulk(user.username);
            })
        }, timeoutDelay);
    }, [users]);

    useEffect(() => {
        fetchMessages(recipient);

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
                    subscribeToMessages(username, recipient);

                    clientRef.current?.subscribe(`/user/${username}/deliver/message`, (message) => {
                        const readMessage = JSON.parse(message.body);
                        setMessages((prevMessages) =>
                            prevMessages.map(msg =>
                                msg.clientId === readMessage.clientId ? { ...msg, deliveredAt: readMessage.deliveredAt } : msg
                            )
                        );
                    });

                    clientRef.current?.subscribe(`/user/${username}/deliver/messages`, (message) => {
                        const deliveredAt = message.body;
                        setMessages((prevMessages) =>
                            prevMessages.map(msg =>
                                (!msg.deliveredAt) ? { ...msg, deliveredAt: deliveredAt } : msg
                            )
                        );
                    });

                    clientRef.current?.subscribe(`/user/${username}/read/messages`, (message) => {
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
        }

        return () => {
            subscriptionRef.current?.unsubscribe();
        };
    }, [username, recipient]);

    useEffect(() => {
        if (isUserAtBottom()) scrollToBottom();
    }, [messages]);

    const subscribeToMessages = (username, recipient) => {
        subscriptionRef.current?.unsubscribe();

        subscriptionRef.current = clientRef.current?.subscribe(`/user/${username}/queue/messages`, (message) => {
            const newMessage = JSON.parse(message.body);
            if (recipient === newMessage.sender) {
                setMessages((prev) => [...prev, newMessage]);
                setTimeout(markMessagesAsRead, 300);
                if (isUserAtBottom()) setTimeout(scrollToBottom, 50);
            } else {
                processUnreadMessage(newMessage);
                sendDeliveredReceiptWithRetry(newMessage.clientId);
            }
        });
    }

    const isUserAtBottom = () => {
        const messageContainer = document.getElementById('message-container');
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
                showInfo({
                    success: true,
                    message: 'You are connected to chat!'
                });
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
    };

    const handleMessageChange = (e) => {
        setMessageText(e.target.value);
    }

    const handleReceiverChange = (username) => {
        setRecipient(username);
    }

    const handleBack = () => {
        setRecipient('')
    }

    const handleSendMessage = (e) => {
        const now = new Date();
        const timeStamp = '_' + now.getUTCFullYear() + now.getMonth() + now.getDate()
            + now.getHours() + now.getMinutes() + now.getSeconds() + now.getMilliseconds();
        const offset = now.getTimezoneOffset();
        const sentAt = new Date(now.getTime() - offset * 60000).toISOString().slice(0, 19);
        e.preventDefault();
        const messageData = {
            clientId: username + '_' + recipient + timeStamp,
            sender: username,
            receiver: recipient,
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
        if (clientRef.current) {
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
        try {
            clientRef.current.publish({
                destination: '/app/set-delivered/messages',
                body: JSON.stringify({
                    sender: recipient,
                    receiver: storedUsername,
                }),
            });
        } catch (error) {
            console.error('STOMP publish error:', error);
        }
    }

    const sendDeliveredReceipt = (clientId) => {
        try {
            clientRef.current.publish({
                destination: '/app/set-delivered/message',
                body: clientId,
            });
        } catch (error) {
            console.error('STOMP publish error:', error);
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
        try {
            clientRef.current.publish({
                destination: '/app/read/message',
                body: clientId,
            });
        } catch (error) {
            console.error('STOMP publish error:', error);
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
            [recipient]: 0
        }));
    };

    const handleSearchPhoneChange = (e) => {
        e.preventDefault();
        setPhoneToSearch(e.target.value);
    }

    const handleSearchByPhone = (e) => {
        e.preventDefault();

        getByPhone(phoneToSearch).then(response => {
            if (response.success && response.data) {
                const newRecipient = response.data;
                const isInActiveChats = users.some((user) => user.username === newRecipient.username);
                setRecipient(newRecipient.username);
                setPhoneToSearch('');
                if (!isInActiveChats) {
                    setUsers((prev) => [...prev, newRecipient]);
                }
            }
            else {
                showInfo({
                    success: false,
                    message: 'Couldn\'t find any user for this phone'
                })
            }
        });
    }

    const handleLogOut = () => {
        logout();
    }

    return (
        <div className='home-container'>
            <link rel='stylesheet' href={'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'}/>

            <Title />
            <h2 className='subtitle'>
                <i className='fas fa-user-circle'></i> You are logged in as <u><strong>{username}</strong></u>
                <p onClick={handleLogOut} className='link-btn'>Log out</p>
            </h2>
            <form onSubmit={handleSearchByPhone}>
                <input id='search-input'
                       type='text'
                       placeholder='Search by phone'
                       onChange={handleSearchPhoneChange}
                       value={phoneToSearch}
                />
            </form>
            <div id='acitve-chats' className='select user-list'>
                {users.map((user, index) => {
                    return (
                        <div key={index}
                             id={'user-' + user.username}
                             className={`user-item ${recipient === user.username ? 'selected' : ''}`}
                             onClick={() => handleReceiverChange(user.username)}>
                            {user.username}
                            {unreadMessages[user.username] > 0 && (
                                <span className='unread-badge'>
                                    {unreadMessages[user.username]}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            <div ref={messageListRef} className={`message-list-container`} id='message-container'>
                <div className={`selected-user-title ${recipient ? '' : 'hidden'}`}>
                    <span id='back' onClick={handleBack}></span>
                    <p>{recipient}</p>
                </div>
                <ul id='message-list' className='message-list'>
                    {messages.map((message, index) => (
                        <li key={index}>
                            <div id={message.clientId}
                                 className={`message-item ${message.sender === username ? 'message-item-right' : 'message-item-left'} ${(!message.readAt && message.sender === recipient) ? 'unread' : ''}`}>
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

            <form onSubmit={handleSendMessage} className={'message-input-form ' + (recipient ? '' : 'hidden')}>
                <input id='message'
                       name='message'
                       value={messageText}
                       onChange={handleMessageChange}
                       type='text'
                       placeholder='Type your message'
                       autoComplete='off'
                />
                <button type='submit' className='btn fas fa-paper-plane'></button>
            </form>

            <Info info={info} key={infoKey}/>

            <ToggleTheme />
        </div>
    )
}