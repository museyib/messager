import Title from "../TitleFragment.jsx";
import ToggleTheme from "../ToggleThemeFragment.jsx";
import {useEffect, useState} from "react";
import axiosInstance from "../../api/auth.js";
import {useNavigate} from "react-router";

export default function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([{
        id: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        allowReceiveMessage: false,
        showContactInformation: false,
        verified: false,
    }]);

    useEffect(() => {
        axiosInstance.get('/admin/users', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        }).then(response => {
            setUsers(response.data.data);
        }).catch(error => {
            if (error.response.status === 403) {
                navigate('/403');
            }
        })
    }, []);

    const handleChange = (e) => {
        const {id, name, checked} = e.target;
        const newUsers = users.map(user => {
            if (user.id === Number(id)) {
                return {...user, [name]: checked};
            }
            return user;
        });
        setUsers(newUsers);
    };
    return (
        <div>
            <link rel='stylesheet' href={'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'}/>
            <Title />
            <table className="table">
                <thead>
                <tr>
                    <th>User ID</th>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Password</th>
                    <th>Allow Receive Message</th>
                    <th>Show Contact Information</th>
                    <th>Verified</th>
                    <th>Edit</th>
                    <th>Delete</th>
                </tr>
                </thead>
                <tbody>
                {
                    users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.phone}</td>
                            <td>{user.password}</td>
                            <td>
                                <input id={user.id}
                                       name='allowReceiveMessage'
                                       type='checkbox'
                                       checked={user.allowReceiveMessage}
                                       onChange={handleChange}/>
                            </td>
                            <td>
                                <input id={user.id}
                                       name='showContactInformation'
                                       type='checkbox'
                                       checked={user.showContactInformation}
                                       onChange={handleChange}/>
                            </td>
                            <td>
                                <input id={user.id}
                                       name='verified'
                                       type='checkbox'
                                       checked={user.verified}
                                       onChange={handleChange}/>
                            </td>
                            <td className='center'><button className='link-btn fas fa-pen'></button></td>
                            <td className='center'><button className='link-btn-red fas fa-trash'></button></td>
                        </tr>
                    ))
                }
                </tbody>
            </table>

            <ToggleTheme />
        </div>
    )
}