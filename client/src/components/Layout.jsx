import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            {/* --- YEH HAI ASAL HAL (PART 2) ---
                pt-16 (padding-top: 4rem) add karne se main content Navbar ke neeche se shuru hoga.
                Aam taur par ek navbar ki height 16 units (4rem ya 64px) ke qareeb hoti hai. */}
            <main className="flex-grow pt-16">
                <Outlet /> {/* This will render the child route component */}
            </main>
            <Footer/>
        </div>
    );
};

export default Layout;