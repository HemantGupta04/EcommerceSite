import React, { createContext, useContext, useEffect, useState } from 'react';

const LocationContext = createContext(null);
const KEY = 'geo:v1';

export const LocationProvider = ({ children }) => {
    const [coords, setCoords] = useState(null);
    const [denied, setDenied] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setCoords(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    const request = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                localStorage.setItem(KEY, JSON.stringify(c));
                setCoords(c);
                setDenied(false);
                resolve(c);
            },
            (err) => {
                setDenied(true);
                reject(err);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    const setManual = (c) => {
        localStorage.setItem(KEY, JSON.stringify(c));
        setCoords(c);
    };

    return (
        <LocationContext.Provider value={{ coords, denied, request, setManual }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);
