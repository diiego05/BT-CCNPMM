import { Outlet } from "react-router-dom";
import Header from "./components/layout/header";
import axios from "./util/axios.customize";
import { useContext, useEffect } from "react";
import { AuthContext } from "./components/context/auth.context";

function App() {
    const { setAuth, appLoading, setAppLoading } = useContext(AuthContext);

    useEffect(() => {
        const fetchAccount = async () => {
            setAppLoading(true);
            const res = await axios.get(`/v1/api/account`);
            if (res && !res.message) {
                setAuth({
                    isAuthenticated: true,
                    user: { email: res.email, name: res.name }
                });
            } else {
                // Token hết hạn hoặc không hợp lệ → xóa khỏi localStorage
                localStorage.removeItem('access_token');
                setAuth({ isAuthenticated: false, user: { email: '', name: '' } });
            }
            setAppLoading(false);
        }
        fetchAccount();
    }, []);

    return (
        <div>
            {appLoading === true ?
                <div className="spinner-overlay">
                    <div className="spinner" />
                </div>
                :
                <>
                    <Header />
                    <Outlet />
                </>
            }
        </div>
    )
}
export default App;