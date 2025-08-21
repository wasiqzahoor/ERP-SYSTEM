// src/components/Footer.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiLink, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
    const footerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut",
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const SocialIcon = ({ href, icon, 'aria-label': ariaLabel }) => (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ariaLabel}
            className="text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.2, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
        >
            {icon}
        </motion.a>
    );

    return (
        <motion.footer
            className="bg-gray-800 text-white"
            variants={footerVariants}
            initial="hidden"
            whileInView="visible" // Footer tab animate hoga jab woh screen par nazar aayega
            viewport={{ once: true, amount: 0.5 }}
        >
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Column 1: Brand/Logo */}
                    <motion.div variants={itemVariants} className="col-span-1 md:col-span-1">
                        <div className="flex items-center space-x-2">
                            <img
                                src="https://static.vecteezy.com/system/resources/thumbnails/046/593/914/small/creative-logo-design-for-real-estate-company-vector.jpg"
                                alt="Logo"
                                className="h-10 w-10 rounded-full"
                            />
                            <span className="text-2xl font-bold tracking-wider">ERP System</span>
                        </div>
                        <p className="mt-4 text-gray-400 text-sm">
                            Streamlining your business operations with modern, efficient solutions.
                        </p>
                    </motion.div>

                    {/* Column 2: Quick Links */}
                    <motion.div variants={itemVariants}>
                        <h3 className="text-lg font-semibold tracking-wide">Quick Links</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
                            <li><a href="/inventory" className="text-gray-400 hover:text-white transition-colors">Inventory</a></li>
                            <li><a href="/sales" className="text-gray-400 hover:text-white transition-colors">Sales</a></li>
                            <li><a href="/reports" className="text-gray-400 hover:text-white transition-colors">Reports</a></li>
                        </ul>
                    </motion.div>

                    {/* Column 3: Legal */}
                    <motion.div variants={itemVariants}>
                        <h3 className="text-lg font-semibold tracking-wide">Legal</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
                        </ul>
                    </motion.div>

                    {/* Column 4: Contact/Social */}
                    <motion.div variants={itemVariants}>
                        <h3 className="text-lg font-semibold tracking-wide">Connect With Us</h3>
                        <p className="mt-4 text-gray-400 text-sm">
                            your.email@example.com
                        </p>
                        <div className="mt-4 flex space-x-4">
                            <SocialIcon href="#" icon={<FiGithub size={20} />} aria-label="GitHub" />
                            <SocialIcon href="#" icon={<FiTwitter size={20} />} aria-label="Twitter" />
                            <SocialIcon href="#" icon={<FiLinkedin size={20} />} aria-label="LinkedIn" />
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Bar */}
                <motion.div
                    className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    <p className="flex items-center justify-center gap-2">
                        <span>© {new Date().getFullYear()} ERP System. All Rights Reserved.</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="flex items-center gap-1.5">
                            Made By <FiHeart className="text-red-500 animate-pulse" /> CHAUDHARY WASIQ ZAHOOR
                        </span>
                    </p>
                </motion.div>
            </div>
        </motion.footer>
    );
};

export default Footer;