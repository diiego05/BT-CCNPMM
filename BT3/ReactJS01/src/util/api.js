import axios from './axios.customize';

const createUserApi = (name, email, password) => {
    return axios.post("/v1/api/register", { name, email, password });
};

const loginApi = (email, password) => {
    return axios.post("/v1/api/login", { email, password });
};

const getUserApi = () => {
    return axios.get("/v1/api/user");
};

const forgotPasswordApi = (email, newPassword) => {
    return axios.post("/v1/api/forgot-password", { email, newPassword });
};

export { createUserApi, loginApi, getUserApi, forgotPasswordApi };