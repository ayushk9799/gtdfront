import React from 'react';
import { View } from 'react-native';

// Import SVG files as React components
import CardiologyIcon from '../../constants/department_icons/cardiology.svg';
import DermatologyIcon from '../../constants/department_icons/dermatology.svg';
import EmergencyMedicineIcon from '../../constants/department_icons/emergency-medicine.svg';
import GeneralSurgeryIcon from '../../constants/department_icons/general-surgery.svg';
import GynecologyIcon from '../../constants/department_icons/gynecology.svg';
import InternalMedicineIcon from '../../constants/department_icons/internal-medicine.svg';
import NeurologyIcon from '../../constants/department_icons/neurology.svg';
import OphthalmologyIcon from '../../constants/department_icons/ophthalmology.svg';
import OrthopedicsIcon from '../../constants/department_icons/orthopedics.svg';
import PediatricsIcon from '../../constants/department_icons/pediatrics.svg';
import PsychiatryIcon from '../../constants/department_icons/psychiatry.svg';
import PulmonologyIcon from '../../constants/department_icons/pulmonology.svg';

/**
 * Department Icons mapping
 * Maps department names (lowercase) to their SVG icon components
 * 
 * Usage:
 * const IconComponent = DepartmentIcons['cardiology'];
 * <IconComponent width={24} height={24} />
 */
export const DepartmentIcons = {
    // Exact matches
    "cardiology": CardiologyIcon,
    "dermatology": DermatologyIcon,
    "emergency medicine": EmergencyMedicineIcon,
    "general surgery": GeneralSurgeryIcon,
    "gynecology": GynecologyIcon,
    "obstetrics & gynecology": GynecologyIcon,
    "internal medicine": InternalMedicineIcon,
    "neurology": NeurologyIcon,
    "ophthalmology": OphthalmologyIcon,
    "orthopedics": OrthopedicsIcon,
    "orthopedic": OrthopedicsIcon,
    "pediatrics": PediatricsIcon,
    "psychiatry": PsychiatryIcon,
    "pulmonology": PulmonologyIcon,
    // Aliases
    "surgery": GeneralSurgeryIcon,
    "obgyn": GynecologyIcon,
    "ob/gyn": GynecologyIcon,
    "emergency": EmergencyMedicineIcon,
    "ent": PulmonologyIcon, // Fallback - ideally add an ENT icon
    "otolaryngology": PulmonologyIcon, // Fallback - ideally add an ENT icon
};

/**
 * Helper function to get a department icon component
 * @param {string} departmentName - The department name (case-insensitive)
 * @param {object} props - Props to pass to the icon (width, height, etc.)
 * @returns {React.Component|null} The icon component or null if not found
 */
export const getDepartmentIcon = (departmentName, props = { width: 24, height: 24 }) => {
    if (!departmentName) return null;

    const normalizedName = departmentName.toLowerCase().trim();
    const IconComponent = DepartmentIcons[normalizedName];

    if (IconComponent) {
        const { width, height } = props;
        return (
            <View style={{ width, height }}>
                <IconComponent
                    width="100%"
                    height="100%"
                    style={{ width, height }}
                    preserveAspectRatio="xMidYMid meet"
                />
            </View>
        );
    }

    return null;
};

export default DepartmentIcons;