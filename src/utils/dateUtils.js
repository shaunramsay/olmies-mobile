/**
 * UTech Jamaica Academic Calendar Logic
 * Semester 1: September 1 to December 30
 * Semester 2: January 1 to May 30
 * Semester 3: June 1 to August 31
 */

export const getUTechSemester = (date = new Date()) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const calendarYear = date.getFullYear();

  let semester;
  let semesterNumber;
  let year = calendarYear;
  let isTransitionDay = false;

  if (month >= 1 && (month < 5 || (month === 5 && day <= 30))) {
    semester = "Semester 2";
    semesterNumber = "2";
  } else if (month === 5 && day === 31) {
    semester = "Semester 3";
    semesterNumber = "3";
    isTransitionDay = true;
  } else if (month >= 6 && month <= 8) {
    semester = "Semester 3";
    semesterNumber = "3";
  } else if (month >= 9 && (month < 12 || day <= 30)) {
    semester = "Semester 1";
    semesterNumber = "1";
  } else {
    semester = "Semester 2";
    semesterNumber = "2";
    year = calendarYear + 1;
    isTransitionDay = true;
  }

  return {
    semesterString: semester,
    semesterNumber,
    year: year,
    periodCode: `${year}-S${semesterNumber}`,
    fullDisplay: `${semester} - ${year}`,
    isTransitionDay
  };
};

const normalizePeriod = (period, fallback = getUTechSemester()) => {
  if (!period) return fallback;
  const semester = period.semester || period.Semester || fallback.semesterString;
  const year = Number(period.year || period.Year || fallback.year);
  const semesterNumber = semester.includes('1') ? '1' : semester.includes('2') ? '2' : semester.includes('3') ? '3' : fallback.semesterNumber;

  return {
    semesterString: semester,
    semesterNumber,
    year,
    periodCode: period.periodCode || period.PeriodCode || `${year}-S${semesterNumber}`,
    fullDisplay: period.displayName || period.DisplayName || `${semester} - ${year}`,
    isTransitionDay: Boolean(period.isTransitionDay || period.IsTransitionDay || fallback.isTransitionDay)
  };
};

export const fetchUTechSemester = async (fetchWithAuth) => {
  const fallback = getUTechSemester();

  try {
    const response = await fetchWithAuth('/api/v1/academic-period/current', { cache: 'no-store' });
    if (!response.ok) return fallback;
    return normalizePeriod(await response.json(), fallback);
  } catch {
    return fallback;
  }
};
