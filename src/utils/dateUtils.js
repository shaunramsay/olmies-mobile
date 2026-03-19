/**
 * UTech Jamaica Academic Calendar Logic
 * Semester 1: September to December
 * Semester 2: January to May
 * Semester 3: June to August
 */

export const getUTechSemester = (date = new Date()) => {
  const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
  let year = date.getFullYear();

  let semester;

  if (month >= 9 && month <= 12) {
    semester = "Semester 1";
    // For UTech, September starts the new academic year, but the calendar year hasn't flipped.
    // However, usually they just refer to the calendar year or academic year. 
    // We will stick to the exact calendar year to match the UI spec.
  } else if (month >= 1 && month <= 5) {
    semester = "Semester 2";
  } else if (month >= 6 && month <= 8) {
    semester = "Semester 3";
  } else {
    // Fallback just in case
    semester = "Semester";
  }

  return {
    semesterString: semester,
    year: year,
    fullDisplay: `${semester} - ${year}`
  };
};
