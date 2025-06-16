import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';

interface CustomDatePickerProps {
  selected: Date;
  onChange: (date: Date | null) => void;
  className?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selected, onChange, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="MMMM d, yyyy"
        className="w-full px-4 py-3 text-base sm:text-lg border-2 border-blue-400 rounded-xl 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 bg-white
          hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200
          shadow-md hover:shadow-lg active:shadow-inner"
        popperClassName="z-50"
        popperPlacement="bottom-start"
        calendarClassName="bg-white rounded-lg shadow-lg border border-gray-200 p-2 sm:p-4"
        dayClassName={() => "hover:bg-blue-100 rounded-full transition-colors duration-200"}
        weekDayClassName={() => "text-gray-600 font-medium"}
        monthClassName={() => "p-2"}
        yearClassName={() => "p-2"}
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between px-2 py-2 sm:px-4 sm:py-3">
            <button
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors duration-200"
              aria-label="Previous month"
            >
              <span className="text-lg sm:text-xl">←</span>
            </button>
            <span className="text-base sm:text-lg font-semibold text-gray-800">
              {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors duration-200"
              aria-label="Next month"
            >
              <span className="text-lg sm:text-xl">→</span>
            </button>
          </div>
        )}
        // Mobile optimizations
        showPopperArrow={false}
        // Custom styling for the calendar
        calendarStartDay={1} // Start week on Monday
        formatWeekDay={nameOfDay => nameOfDay.slice(0, 3)} // Short day names
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
      />
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
        <span className="hidden sm:inline text-sm text-gray-500">Click to select date</span>
        <FontAwesomeIcon
          icon={faCalendar}
          className="text-gray-400 text-lg sm:text-xl"
        />
      </div>
    </div>
  );
};

export default CustomDatePicker; 