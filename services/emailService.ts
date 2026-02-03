
/**
 * HƯỚNG DẪN LẤY MÃ:
 * 1. SERVICE_ID: Lấy tại mục "Email Services" (Ví dụ: service_xxxx)
 * 2. PUBLIC_KEY: Lấy tại mục "Account" -> "API Keys" -> "Public Key"
 * 3. TEMPLATE_ID: Lấy tại mục "Email Templates" -> Cột "Template ID" (Ví dụ: template_xxxx)
 */
const MY_CONFIG = {
  SERVICE_ID: 'service_a2rtyru', 
  PUBLIC_KEY: 'xuRTMHjn8Vmu-cerC',
  TEMPLATE_ID: 'template_2ehby7o', // BẠN CẦN THAY MÃ NÀY TỪ DASHBOARD EMAILJS
};

export const sendOTPEmail = async (email: string, name: string, otp: string) => {
  const { SERVICE_ID, PUBLIC_KEY, TEMPLATE_ID } = MY_CONFIG;

  if (!SERVICE_ID || !PUBLIC_KEY || !TEMPLATE_ID || SERVICE_ID === '' || PUBLIC_KEY === '' || TEMPLATE_ID.includes('wfhgoxk')) {
    return { 
      success: false, 
      error: "Cấu hình EmailJS chưa hoàn thiện (Bạn chưa thay đổi TEMPLATE_ID trong file emailService.ts)." 
    };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        template_params: {
          email: email,
          passcode: otp,
          time: '15 phút',
          to_name: name || 'Người chơi mới',
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      if (errorData.includes("template_id")) {
        return { success: false, error: `Lỗi: Không tìm thấy Template ID "${TEMPLATE_ID}". Hãy kiểm tra lại tab Email Templates trên EmailJS.` };
      }
      throw new Error(errorData);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Lỗi gửi Email:", error);
    return { success: false, error: "Lỗi kết nối API hoặc sai cấu hình EmailJS." };
  }
};
