import axiosInstance from "./auth.js";


export const getMessagesByRecipient = (username, recipient) => {
    const token = localStorage.getItem('token');
    return axiosInstance.get('/message/latest?sender=' + username + "&receiver=" + recipient, {
        headers: {
            Authorization: 'Bearer ' + token
        }
    }).then((response) => {
        return {
            success: true,
            data: response.data.data,
        }
    }).catch((response) => {
        return {
            success: false,
            message: response.message,
        }
    });
};

export const getUnreadMessagesByUsername = (username) => {
    const token = localStorage.getItem('token');
    return axiosInstance.get('/message/unread?username=' + username, {
        headers: {
            Authorization: 'Bearer ' + token
        }
    }).then((response) => {
        return {
            success: true,
            data: response.data.data,
        }
    }).catch((response) => {
        return {
            success: false,
            message: response.message,
        }
    });
};