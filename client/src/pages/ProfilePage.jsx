// src/pages/ProfilePage.jsx

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion } from 'framer-motion';
import { FiCamera, FiEdit, FiSave, FiX, FiMail, FiShield, FiBriefcase, FiBookOpen, FiTrash2, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify'; 
const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    
    const [profile, setProfile] = useState({ 
        ...user, 
        experience: user.experience || [],
        education: user.education || [],
        skills: user.skills || []
    });
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // --- 2FA ke liye Nayi States ---
    const [qrCode, setQrCode] = useState('');
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [twoFactorError, setTwoFactorError] = useState('');

    const handleInputChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);
        setUploading(true);
        setError('');

        try {
            const res = await api.post('/api/users/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newAvatarUrl = res.data.avatarUrl;
            
            setProfile({ ...profile, avatar: newAvatarUrl });
            updateUser({ avatar: newAvatarUrl });

        } catch (err) {
            console.error("Avatar upload failed", err);
            toast.error(err.response?.data?.message || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setError('');
        try {
            await api.put('/api/users/profile', profile);
            
            updateUser(profile);
            setIsEditing(false);

        } catch (err) {
            console.error("Failed to save profile", err);
            toast.error(err.response?.data?.message || 'Failed to save.');
        }
    };

    const handleArrayChange = (e, index, field, key) => {
        const updatedArray = [...profile[field]];
        updatedArray[index][key] = e.target.value;
        setProfile({ ...profile, [field]: updatedArray });
    };

    const addArrayItem = (field) => {
        const newItem = field === 'experience'
            ? { title: '', company: '', years: '' }
            : { degree: '', institution: '', year: '' };
        setProfile({ ...profile, [field]: [...profile[field], newItem] });
    };

    const removeArrayItem = (index, field) => {
        const updatedArray = [...profile[field]];
        updatedArray.splice(index, 1);
        setProfile({ ...profile, [field]: updatedArray });
    };

    // --- Naya Function: QR Code Generate Karne ke Liye ---
    const handleGenerate2FA = async () => {
        setTwoFactorError('');
        try {
            const res = await api.post('/api/users/2fa/generate');
            setQrCode(res.data.qrCodeUrl);
        } catch (err) {
            setTwoFactorError('Could not generate QR code. Please try again.');
        }
    };

    // --- Naya Function: Token Verify Karne ke Liye ---
    const handleVerify2FA = async () => {
        setTwoFactorError('');
        if (!twoFactorToken || twoFactorToken.length !== 6) {
            setTwoFactorError('Please enter the 6-digit code from your app.');
            return;
        }
        try {
            await api.post('/api/users/2fa/verify', { token: twoFactorToken });
            toast.success("2FA enabled successfully!");
            
            // UI ko update karein
            updateUser({ ...user, twoFactorEnabled: true });
            setQrCode(''); // QR code ko hide kar dein
            setTwoFactorToken('');
            
        } catch (err) {
            setTwoFactorError(err.response?.data?.message || 'Verification failed. The code may be incorrect or expired.');
        }
    };

    if (!profile) return <div className="text-center p-10">Loading...</div>;

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* --- Profile Header Card --- */}
                <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
                    <div className="relative group">
                        <img
                            src={profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`}
                            alt="avatar"
                            className="w-32 h-32 rounded-full border-4 border-indigo-200 object-cover"
                        />
                        <button onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <FiCamera size={24} />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*"/>
                        {uploading && <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center"><div className="w-8 h-8 border-t-2 border-indigo-600 rounded-full animate-spin"></div></div>}
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        {isEditing ? (
                             <input type="text" name="username" value={profile.username || ''} onChange={handleInputChange} className="text-2xl font-extrabold text-gray-800 border-b-2 border-indigo-500 "/>
                        ) : (
                            <h1 className="text-4xl font-extrabold text-gray-800">{profile.username}</h1>
                        )}
                        <p className="text-gray-500 mt-2 flex items-center justify-center sm:justify-start">
                            <FiMail className="mr-2"/> {profile.email}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        {isEditing ? (
                            <>
                                <button onClick={() => { setIsEditing(false); setProfile(user); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 flex items-center"><FiX className="mr-2"/>Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center"><FiSave className="mr-2"/>Save</button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 flex items-center"><FiEdit className="mr-2"/>Edit Profile</button>
                        )}
                    </div>
                </motion.div>

                {/* --- Main Content Card --- */}
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-white rounded-2xl shadow-lg p-8 mt-8">
                    {/* About Me Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">About Me</h2>
                        <div className="mt-6 space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Bio</label>
                                {isEditing ? <textarea name="bio" value={profile.bio || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" rows="4"/> : <p className="text-gray-700">{profile.bio || "N/A"}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Address</label>
                                {isEditing ? <input type="text" name="address" value={profile.address || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md"/> : <p className="text-gray-700">{profile.address || "N/A"}</p>}
                            </div>
                        </div>
                    </div>
                    
                    {/* Conditional Sections */}
                    {(profile.roles && profile.roles.some(r => r.name === 'Employee' || r.name === 'Manager')) &&
                        <>
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">Professional Information</h2>
                            <div className="mt-6 space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Skills</label>
                                    {isEditing ? <input type="text" value={profile.skills?.join(', ') || ''} onChange={e => setProfile({...profile, skills: e.target.value.split(',').map(s=>s.trim())})} className="mt-1 w-full p-2 border rounded-md" placeholder="React, NodeJS, etc."/> : <div className="flex flex-wrap gap-2 mt-2">{profile.skills?.map(s => <span key={s} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{s}</span>) || "N/A"}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Experience Section */}
                        <div className="mt-8">
                            <label className="text-sm font-semibold text-gray-600 flex items-center"><FiBriefcase className="mr-2"/>Work Experience</label>
                            <div className="mt-2 space-y-4">
                                {profile.experience.map((exp, index) => (
                                    <div key={index} className="p-3 rounded-md border bg-gray-50/50">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <input type="text" placeholder="Job Title" value={exp.title} onChange={e => handleArrayChange(e, index, 'experience', 'title')} className="w-full font-bold p-1 border-b"/>
                                                    <button onClick={() => removeArrayItem(index, 'experience')} className="ml-2 text-red-500"><FiTrash2 size={16}/></button>
                                                </div>
                                                <input type="text" placeholder="Company Name" value={exp.company} onChange={e => handleArrayChange(e, index, 'experience', 'company')} className="w-full text-sm p-1 border-b"/>
                                                <input type="text" placeholder="Years (e.g., 2020-2022)" value={exp.years} onChange={e => handleArrayChange(e, index, 'experience', 'years')} className="w-full text-xs p-1 border-b"/>
                                            </div>
                                        ) : (
                                            <div>
                                                <h4 className="font-bold text-gray-800">{exp.title || "N/A"}</h4>
                                                <p className="text-sm text-gray-600">{exp.company || "N/A"}</p>
                                                <p className="text-xs text-gray-400 mt-1">{exp.years || "N/A"}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isEditing && <button onClick={() => addArrayItem('experience')} className="flex items-center text-sm text-indigo-600 font-semibold mt-2"><FiPlus className="mr-1"/>Add Experience</button>}
                            </div>
                        </div>

                        {/* Education Section */}
                        <div className="mt-8">
                            <label className="text-sm font-semibold text-gray-600 flex items-center"><FiBookOpen className="mr-2"/>Education</label>
                            <div className="mt-2 space-y-4">
                                {profile.education.map((edu, index) => (
                                    <div key={index} className="p-3 rounded-md border bg-gray-50/50">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <input type="text" placeholder="Degree" value={edu.degree} onChange={e => handleArrayChange(e, index, 'education', 'degree')} className="w-full font-bold p-1 border-b"/>
                                                    <button onClick={() => removeArrayItem(index, 'education')} className="ml-2 text-red-500"><FiTrash2 size={16}/></button>
                                                </div>
                                                <input type="text" placeholder="Institution" value={edu.institution} onChange={e => handleArrayChange(e, index, 'education', 'institution')} className="w-full text-sm p-1 border-b"/>
                                                <input type="text" placeholder="Year" value={edu.year} onChange={e => handleArrayChange(e, index, 'education', 'year')} className="w-full text-xs p-1 border-b"/>
                                            </div>
                                        ) : (
                                            <div>
                                                <h4 className="font-bold text-gray-800">{edu.degree || "N/A"}</h4>
                                                <p className="text-sm text-gray-600">{edu.institution || "N/A"}</p>
                                                <p className="text-xs text-gray-400 mt-1">{edu.year || "N/A"}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isEditing && <button onClick={() => addArrayItem('education')} className="flex items-center text-sm text-indigo-600 font-semibold mt-2"><FiPlus className="mr-1"/>Add Education</button>}
                            </div>
                        </div>
                        </>
                    }
                    
                    {/* --- NAYA 2FA SECURITY SECTION --- */}
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 flex items-center">
                            <FiShield className="mr-3 text-indigo-600"/> Security Settings
                        </h2>
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold">Two-Factor Authentication (2FA)</h3>
                            {user.twoFactorEnabled ? (
                                <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-green-800 font-semibold">2FA is currently enabled on your account.</p>
                                    <p className="text-sm text-green-700">You will be asked for an authentication code when you log in.</p>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <p className="text-gray-600">
                                        Enhance your account security by requiring a second verification step at login.
                                    </p>
                                    {!qrCode ? (
                                        <button onClick={handleGenerate2FA} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700">
                                            Enable 2FA
                                        </button>
                                    ) : (
                                        <div className="mt-4 p-4 border rounded-lg">
                                            <p className="font-semibold mb-2">Step 1: Scan this QR code with your authenticator app (e.g., Google Authenticator).</p>
                                            <img src={qrCode} alt="2FA QR Code" className="mx-auto my-4 border p-2"/>
                                            <p className="font-semibold mb-2">Step 2: Enter the 6-digit code from your app below to verify.</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <input 
                                                    type="text"
                                                    maxLength="6"
                                                    value={twoFactorToken}
                                                    onChange={(e) => setTwoFactorToken(e.target.value)}
                                                    placeholder="123456"
                                                    className="p-2 border rounded-md w-40 text-center tracking-widest"
                                                />
                                                <button onClick={handleVerify2FA} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">
                                                    Verify & Enable
                                                </button>
                                            </div>
                                            {twoFactorError && <p className="text-red-500 text-sm mt-2">{twoFactorError}</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;