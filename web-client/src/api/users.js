import axiosInstance from "./auth.js";

export const getActiveChats = () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return axiosInstance.get('/user/active-chats?username=' + username, {
        headers: {
            Authorization: 'Bearer ' + token
        }
    }).then((response) => {
        return {
            success: true,
            data: response.data.data
        }
    }).catch((response) => {
        console.log(response);
        return {
            success: false,
            message: response.message,
        }
    });
}

export const getByPhone = (phone) => {
    const token = localStorage.getItem('token');
    return axiosInstance.get('/user/by-phone?phone=' + encodeURIComponent(phone), {
        headers: {
            Authorization: 'Bearer ' + token
        }
    }).then((response) => {
        return {
            success: true,
            data: response.data.data
        }
    }).catch((response) => {
        return {
            success: false,
            message: response.message,
        }
    })
}
export const checkForExistence = (name, value) => {
    return axiosInstance.get('/user/check/by-'+ name + '/' + encodeURIComponent(value)).then((response) => {
        return {
            success: true,
            data: response.data.data
        }
    }).catch((response) => {
        return {
            success: false,
            message: response.message,
        }
    })
}