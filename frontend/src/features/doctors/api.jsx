const API_URL = "/api/doctors";

// جلب جميع الأطباء
export async function fetchDoctorsApi() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch doctors");
  return response.json();
}

// إنشاء طبيب جديد
export async function createDoctorApi(doctorData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doctorData),
  });
  if (!response.ok) throw new Error("Failed to create doctor");
  return response.json();
}

// تحديث طبيب
export async function updateDoctorApi(doctorId, updatedData) {
  const response = await fetch(`${API_URL}/${doctorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData),
  });
  if (!response.ok) throw new Error("Failed to update doctor");
  return response.json();
}

// حذف طبيب
export async function deleteDoctorApi(doctorId) {
  const response = await fetch(`${API_URL}/${doctorId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete doctor");
  return response.json();
}
