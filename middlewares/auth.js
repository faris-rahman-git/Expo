const isLogin = (req, res, next) => {
  if (req.session.user && req.session.user?.role === "User") {
    return res.status(200).redirect("/home");
  }
  if (req.session.user && req.session.user?.role === "Admin") {
    return res.status(200).redirect("/admin/allUsers");
  }
  return next();
};

const isNotLoginUser = (req, res, next) => {
  if (req.session.user?.role === "User") {
    return next();
  }
  return res.status(400).redirect("/login");
};

const isNotLoginAdmin = (req, res, next) => {
  if (req.session.user?.role === "Admin") {
    return next();
  }
  return res.status(400).redirect("/login");
};

const errHandler = (err, req, res, next) => {
  console.error(err.stack);

  const redirectUrl = err.redirectUrl || "/login";
  res.status(err.status || 500).redirect(redirectUrl);
};

const notFoundHandler = (req, res, next) => {
  res.status(404).render("404Page");
};

module.exports = {
  isLogin,
  isNotLoginUser,
  isNotLoginAdmin,
  errHandler,
  notFoundHandler,
};
