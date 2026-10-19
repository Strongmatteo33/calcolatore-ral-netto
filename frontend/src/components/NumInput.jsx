import React, { useState, useEffect } from 'react';

const toNum = v => parseFloat(String(v).replace(',', '.')) || 0;
const toDisplay = v => String(v).replace('.', ',');

export default function NumInput({ value, onChange, style, ...rest }) {
  const [raw, setRaw] = useState(value === 0 ? '' : toDisplay(value));

  // sync se il valore esterno cambia (reset form ecc.)
  useEffect(() => {
    if (toNum(raw) !== value) setRaw(value === 0 ? '' : toDisplay(value));
  }, [value]);

  const handleChange = e => {
    // consenti solo cifre, virgola e punto (convertiti in virgola)
    const v = e.target.value.replace('.', ',').replace(/[^0-9,]/g, '');
    setRaw(v);
    onChange(toNum(v));
  };

  const handleBlur = () => {
    if (raw === '' || raw === ',') { setRaw(''); onChange(0); }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      style={style}
      onChange={handleChange}
      onBlur={handleBlur}
      {...rest}
    />
  );
}
