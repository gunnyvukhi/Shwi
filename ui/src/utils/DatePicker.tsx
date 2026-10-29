import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './DatePicker.css';

export interface DatePickerProps {
    value: string; // 'YYYY-MM-DD'
    onChange: (dateStr: string) => void;
    max?: string; // 'YYYY-MM-DD'
    min?: string; // 'YYYY-MM-DD'
    id?: string;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    ariaLabel?: string;
}

export const getTodayStr = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const getYesterdayStr = (): string => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

export default function DatePicker({
    value,
    onChange,
    max,
    min,
    id,
    name,
    placeholder,
    disabled = false,
    className = '',
    ariaLabel,
}: DatePickerProps) {
    const { t } = useLanguage();

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial year and month from value, or today
    const parsedDate = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(value + 'T00:00:00')
        : new Date();

    const [viewYear, setViewYear] = useState<number>(parsedDate.getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(parsedDate.getMonth()); // 0-indexed

    // When value changes from outside, sync view
    useEffect(() => {
        if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const d = new Date(value + 'T00:00:00');
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
        }
    }, [value]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Month navigation
    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(v => v - 1);
        } else {
            setViewMonth(v => v - 1);
        }
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(v => v + 1);
        } else {
            setViewMonth(v => v + 1);
        }
    };

    const todayStr = getTodayStr();

    const handleGoToToday = () => {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
        if (!isDateDisabled(todayStr)) {
            onChange(todayStr);
        }
    };

    // Check if next month is strictly beyond max
    const isNextMonthDisabled = (() => {
        if (!max) return false;
        const [maxY, maxM] = max.split('-').map(Number);
        if (viewYear > maxY) return true;
        if (viewYear === maxY && viewMonth >= maxM - 1) return true;
        return false;
    })();

    // Check if prev month is strictly before min
    const isPrevMonthDisabled = (() => {
        if (!min) return false;
        const [minY, minM] = min.split('-').map(Number);
        if (viewYear < minY) return true;
        if (viewYear === minY && viewMonth <= minM - 1) return true;
        return false;
    })();

    // Helper to check if a specific date string (YYYY-MM-DD) is out of bounds
    const isDateDisabled = (dateStr: string): boolean => {
        if (max && dateStr > max) return true;
        if (min && dateStr < min) return true;
        return false;
    };

    // Month and Year label
    const currentMonthLabel = t('calendar.monthYear', {
        month: t(`calendar.month${viewMonth + 1}`),
        year: viewYear,
    });

    // Weekdays (Monday first)
    const weekDays = [
        t('calendar.weekdayMon'),
        t('calendar.weekdayTue'),
        t('calendar.weekdayWed'),
        t('calendar.weekdayThu'),
        t('calendar.weekdayFri'),
        t('calendar.weekdaySat'),
        t('calendar.weekdaySun'),
    ];

    // Generate 42 calendar grid cells (Monday-based: 0 = Mon, 6 = Sun)
    const calendarDays = (() => {
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
        const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
        const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

        const cells = [];

        // Previous month filler days
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
            const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
            const dateStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            cells.push({
                dayNum,
                dateStr,
                isCurrentMonth: false,
                isDisabled: isDateDisabled(dateStr),
            });
        }

        // Current month days
        for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            cells.push({
                dayNum,
                dateStr,
                isCurrentMonth: true,
                isDisabled: isDateDisabled(dateStr),
            });
        }

        // Next month filler days (fill up to 42 cells)
        const remaining = 42 - cells.length;
        for (let dayNum = 1; dayNum <= remaining; dayNum++) {
            const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;
            const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
            const dateStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            cells.push({
                dayNum,
                dateStr,
                isCurrentMonth: false,
                isDisabled: isDateDisabled(dateStr),
            });
        }

        return cells;
    })();

    const handleSelectDate = (dateStr: string, isDisabled: boolean) => {
        if (isDisabled || disabled) return;
        onChange(dateStr);
        setIsOpen(false);
    };

    return (
        <div className={`shwi-datepicker ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                id={id}
                name={name}
                className={`shwi-datepicker-trigger ${isOpen ? 'shwi-datepicker-trigger--open' : ''} ${disabled ? 'shwi-datepicker-trigger--disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-label={ariaLabel || t('calendar.selectDate')}
            >
                <span className={`shwi-datepicker-text ${!value ? 'shwi-datepicker-text--placeholder' : ''}`}>
                    {value ? formatDateDisplay(value) : (placeholder || t('calendar.selectDate'))}
                </span>
                <span className="shwi-datepicker-icon" aria-hidden="true">
                    <CalendarIcon size={14} />
                </span>
            </button>

            {/* Calendar Popover */}
            {isOpen && (
                <div className="shwi-datepicker-popover" role="dialog" aria-modal="true">
                    {/* Header: Month/Year & Nav */}
                    <div className="shwi-dp-header">
                        <button
                            type="button"
                            className="shwi-dp-nav-btn"
                            onClick={handlePrevMonth}
                            disabled={isPrevMonthDisabled}
                            aria-label={t('calendar.prevMonth')}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="shwi-dp-title">
                            {currentMonthLabel}
                        </div>

                        <button
                            type="button"
                            className="shwi-dp-nav-btn"
                            onClick={handleNextMonth}
                            disabled={isNextMonthDisabled}
                            aria-label={t('calendar.nextMonth')}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="shwi-dp-weekdays">
                        {weekDays.map(wd => (
                            <div key={wd} className="shwi-dp-weekday">
                                {wd}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="shwi-dp-grid">
                        {calendarDays.map((cell, idx) => {
                            const isSelected = cell.dateStr === value;
                            const isToday = cell.dateStr === todayStr;

                            return (
                                <button
                                    key={`${cell.dateStr}-${idx}`}
                                    type="button"
                                    className={`shwi-dp-cell ${cell.isCurrentMonth ? 'shwi-dp-cell--current' : 'shwi-dp-cell--muted'} ${isSelected ? 'shwi-dp-cell--selected' : ''} ${isToday ? 'shwi-dp-cell--today' : ''}`}
                                    onClick={() => handleSelectDate(cell.dateStr, cell.isDisabled)}
                                    disabled={cell.isDisabled}
                                >
                                    <span className="shwi-dp-cell-num">{cell.dayNum}</span>
                                    {isToday && !isSelected && <span className="shwi-dp-today-dot" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Shortcuts Footer */}
                    <div className="shwi-dp-footer">
                        <button
                            type="button"
                            className="shwi-dp-quick-btn shwi-dp-quick-btn--today-nav"
                            onClick={handleGoToToday}
                            disabled={isDateDisabled(todayStr)}
                        >
                            <CalendarIcon size={12} />
                            <span>{t('calendar.today')}</span>
                        </button>

                        <button
                            type="button"
                            className="shwi-dp-quick-btn shwi-dp-quick-btn--done"
                            onClick={() => setIsOpen(false)}
                        >
                            <Check size={12} />
                            <span>{t('calendar.done')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
