import React, { useState } from 'react';
import { Button } from '@mui/material';
import { FaMinus, FaPlus } from 'react-icons/fa';

const QuantityBox = ({ value = 1, onChange }) => {
    const [inputVal, setInputVal] = useState(value);

    const minus = () => {
        if (inputVal > 1) {
            const newVal = inputVal - 1;
            setInputVal(newVal);
            onChange?.(newVal);
        }
    };

    const plus = () => {
        const newVal = inputVal + 1;
        setInputVal(newVal);
        onChange?.(newVal);
    };

    return (
        <div className="quantityDrop d-flex align-items-center">
            <Button onClick={minus}><FaMinus /></Button>
            <input type="text " text-align-center value={inputVal} readOnly />
            <Button onClick={plus}><FaPlus /></Button>
        </div>
    );
};

export default QuantityBox;
