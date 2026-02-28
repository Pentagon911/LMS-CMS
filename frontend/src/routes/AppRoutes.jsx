import { Routes, Route } from "react-router-dom";
import MyAccount from "../modules/lms/pages/myAccount.jsx";

function AppRoutes(){
    return(
        <Routes>
            <Route path="/lms/myAccount" element={<MyAccount/>} />
            <Route path="/" element={ <h1>testing</h1>} />
        </Routes>
    );
}

export default AppRoutes;
