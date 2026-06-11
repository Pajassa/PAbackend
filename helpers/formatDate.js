export function formatDateExact(isoString, checkin) {
  if (!isoString) return "--";

  const date = new Date(isoString);
  if (isNaN(date)) return "--";

  console.log("formatDateExact helper triggered");

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  if (checkin) {

    return `${day} ${month}, ${year} ${'02'}:${'00'} ${'pm'}`;
  }
  return `${day} ${month}, ${year} ${'11'}:${'00'} ${'am'}`;
}



// export function formatDateExact(dateString, timeString) {
//   if (!dateString || !timeString) return "--";

//   // Extract date part only (YYYY-MM-DD)
//   const datePart = dateString.split("T")[0];

//   // Combine date + time
//   const combinedDateTime = new Date(`${datePart}T${timeString}`);

//   if (isNaN(combinedDateTime)) return "--";

//   const day = String(combinedDateTime.getDate()).padStart(2, "0");
//   const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//   const month = monthNames[combinedDateTime.getMonth()];
//   const year = combinedDateTime.getFullYear();

//   let hours = combinedDateTime.getHours();
//   const minutes = String(combinedDateTime.getMinutes()).padStart(2, "0");
//   const ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12 || 12;

//   return `${day} ${month}, ${year} ${hours}:${minutes} ${ampm}`;
// }
