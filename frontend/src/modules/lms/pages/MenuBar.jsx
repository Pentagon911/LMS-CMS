// src/modules/lms/pages/MenuBar.jsx
import unilogo from '../../../assets/logo.jpg'
import { useState } from 'react';
import { Outlet } from 'react-router-dom'; // <-- add Outlet

export default function MenuBar() {
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <>
            <header id='header'>
                <img src={unilogo} id='logo'/>
                <div id='uni_name'>LMS - University of Moratuwa</div>
            </header>
            <nav id='navigation'>
                <button id='menuButton' onClick={() => setMenuOpen(prev => !prev)}>Menu</button>
                {menuOpen && (
                    <div id='menu'>
                        <div><a href='/lms/myAccount'>My Account</a></div>
                        <div><a href='#'>Academic</a></div>
                        <div><a href='#'>Appeals</a></div>
                        <div><a href='#'>Hostel Management</a></div>
                        <div><a href='#'>Student Welfare</a></div>
                    </div>
                )}
                <a className='link' href='https://online.uom.lk' target='_blank'>Moodle</a>
                <a className='link' href='https://webmail.uom.lk' target='_blank'>Web mail</a>
                <a className='link' href='https://dms.uom.lk/login' target='_blank'>DMS</a>
                <a className='link' href='https://lms.uom.lk/erp/'  target='_blank'>ERP</a>
                <a className='link' href='https://lms.uom.lk/faq.php' target='_blank'>FAQs</a>
                <a className='link' href='https://lms.uom.lk/contactus.php' target='_blank'>Contact Us</a>
                <button id='logout'>Logout</button>
            </nav>

            {/* Outlet for nested routes */}
            <main>
                <Outlet />
            </main>
        </>
    );
}
