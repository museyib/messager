import React, {useEffect, useState} from 'react';

export default function Info({info}) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(!info);
        }, 5000);

        return () => clearTimeout(timer);
    }, [info]);

    return (
        <div id='info-message'
             className={`${info ? 'info-message ' + `${info.success ? 'info-success' : 'info-fail'}` : ''} ${visible ? '' : 'hide-info'} `}>
            <p>{ info && info.message}</p>
        </div>
    );
}