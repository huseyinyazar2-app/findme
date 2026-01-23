
import { UserProfile } from '../types';
import emailjs from '@emailjs/browser';

// --- EMAIL AYARLARI ---
// Buraya BREVO şifrelerini değil, EmailJS panelinden aldığın ID'leri gireceksin.
// Brevo şifreni EmailJS paneline "Add Service -> SMTP" diyerek tanımlamalısın.

const SERVICE_ID = 'service_brevo';      // EmailJS'te oluşturduğun servisin ID'si
const TEMPLATE_ID = 'template_sekarpd';  // EmailJS'teki şablon ID'si
const PUBLIC_KEY = 'R4c2y_jG5uaU6VPw8';  // EmailJS Public Key

// Oturum süresince kodu hafızada tut
let currentVerificationCode: string | null = null;

export const login = async (username: string, pass: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
  return { success: false, error: "Legacy login function called." };
};

export const sendEmailVerification = async (email: string): Promise<boolean> => {
  // 1. Rastgele 6 haneli kod üret
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  currentVerificationCode = code;

  // 2. EmailJS Başlat
  emailjs.init(PUBLIC_KEY);

  try {
      // 3. E-postayı Gönder
      // Bu işlem EmailJS üzerinden Brevo SMTP sunucusunu tetikler.
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          to_email: email,          // Şablonda {{to_email}} değişkeni olmalı
          verification_code: code,  // Şablonda {{verification_code}} değişkeni olmalı
          reply_to: 'no-reply@matrixc.app'
      });
      
      if (response.status === 200) {
        console.log(`✅ Email başarıyla gönderildi: ${email}`);
        return true;
      } else {
        throw new Error(`Email servisi yanıtı: ${response.text}`);
      }

  } catch (error) {
      console.error('❌ Email gönderme hatası:', error);
      
      // Geliştirme aşamasında hata olsa bile akışı bozmamak için konsola basıyoruz
      console.group('%c[Geliştirici Modu - Email Hatası]', 'color: orange; font-weight: bold;');
      console.log('Hata Detayı:', error);
      console.log(`Sanal Kod (Sistemi test etmen için): ${code}`);
      console.log('Lütfen EmailJS panelinde template içinde {{verification_code}} değişkenini tanımladığından emin ol.');
      console.groupEnd();
      
      // KULLANICI DOSTU HATA YÖNETİMİ:
      // Email sunucusu çalışmasa bile geliştirme/demo aşamasında testi devam ettirmek için kodu gösteriyoruz.
      alert(`Email gönderilemedi (Servis hatası). \n\nTest için Doğrulama Kodunuz: ${code}`);

      // Hata durumunda bile true dönerek testi engellemiyoruz
      return true; 
  }
};

export const verifyEmailCode = async (inputCode: string): Promise<boolean> => {
    // Ağ gecikmesi simülasyonu
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Kod kontrolü
    if (currentVerificationCode && inputCode === currentVerificationCode) {
        currentVerificationCode = null; // Başarılı olunca kodu temizle
        return true;
    }
    return false;
}
