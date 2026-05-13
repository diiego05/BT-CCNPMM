export const verifyRecaptcha = (req, res, next) => {
  // --- MOCK CHO TEST: Luôn cho qua ---
  return next();

  /*
  const { recaptchaToken } = req.body;
  
  if (!recaptchaToken) {
    return res.status(400).json({ message: "Vui lòng xác thực reCAPTCHA" });
  }

  // Logic gọi API của Google để xác thực
  // Ví dụ sử dụng axios hoặc fetch:
  // fetch(`https://www.google.com/recaptcha/api/siteverify?secret=YOUR_SECRET_KEY&response=${recaptchaToken}`, {
  //   method: 'POST'
  // })
  // .then(res => res.json())
  // .then(data => {
  //   if (data.success) {
  //     next();
  //   } else {
  //     res.status(400).json({ message: "Xác thực reCAPTCHA thất bại" });
  //   }
  // })
  // .catch(err => res.status(500).json({ message: "Lỗi server khi xác thực reCAPTCHA" }));
  */
};
