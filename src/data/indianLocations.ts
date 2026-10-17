export interface DistrictLocation {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface IndianState {
  name: string;
  code: string;
  districts: DistrictLocation[];
}

export const INDIAN_STATES: IndianState[] = [
  {
    name: 'Tamil Nadu',
    code: 'TN',
    districts: [
      { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
      { name: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0168, longitude: 76.9558 },
      { name: 'Madurai', state: 'Tamil Nadu', latitude: 9.9252, longitude: 78.1198 },
      { name: 'Tiruchirappalli', state: 'Tamil Nadu', latitude: 10.7905, longitude: 78.7047 },
      { name: 'Salem', state: 'Tamil Nadu', latitude: 11.6643, longitude: 78.146 },
      { name: 'Tirunelveli', state: 'Tamil Nadu', latitude: 8.7139, longitude: 77.7567 },
      { name: 'Tiruppur', state: 'Tamil Nadu', latitude: 11.1085, longitude: 77.3411 },
      { name: 'Vellore', state: 'Tamil Nadu', latitude: 12.9165, longitude: 79.1325 },
      { name: 'Erode', state: 'Tamil Nadu', latitude: 11.341, longitude: 77.7172 },
      { name: 'Thoothukudi', state: 'Tamil Nadu', latitude: 8.7642, longitude: 78.1348 },
      { name: 'Dindigul', state: 'Tamil Nadu', latitude: 10.3673, longitude: 77.9803 },
      { name: 'Thanjavur', state: 'Tamil Nadu', latitude: 10.787, longitude: 79.1378 },
      { name: 'Ranipet', state: 'Tamil Nadu', latitude: 12.9272, longitude: 79.333 },
      { name: 'Hosur (Krishnagiri)', state: 'Tamil Nadu', latitude: 12.7409, longitude: 77.8253 },
      { name: 'Ooty (Nilgiris)', state: 'Tamil Nadu', latitude: 11.4173, longitude: 76.7118 },
      { name: 'Nagercoil (Kanyakumari)', state: 'Tamil Nadu', latitude: 8.1833, longitude: 77.4119 },
      { name: 'Kanchipuram', state: 'Tamil Nadu', latitude: 12.8342, longitude: 79.7036 },
      { name: 'Cuddalore', state: 'Tamil Nadu', latitude: 11.748, longitude: 79.7714 },
      { name: 'Karur', state: 'Tamil Nadu', latitude: 10.9601, longitude: 78.0766 },
      { name: 'Namakkal', state: 'Tamil Nadu', latitude: 11.2189, longitude: 78.1674 },
      { name: 'Dharmapuri', state: 'Tamil Nadu', latitude: 12.1211, longitude: 78.1582 },
      { name: 'Sivakasi (Virudhunagar)', state: 'Tamil Nadu', latitude: 9.4533, longitude: 77.7977 },
      { name: 'Pudukkottai', state: 'Tamil Nadu', latitude: 10.3833, longitude: 78.8001 },
      { name: 'Ramanathapuram', state: 'Tamil Nadu', latitude: 9.3639, longitude: 78.8395 },
      { name: 'Theni', state: 'Tamil Nadu', latitude: 10.0104, longitude: 77.4768 },
      { name: 'Tiruvannamalai', state: 'Tamil Nadu', latitude: 12.2253, longitude: 79.0747 },
      { name: 'Villupuram', state: 'Tamil Nadu', latitude: 11.9401, longitude: 79.4861 },
      { name: 'Chengalpattu', state: 'Tamil Nadu', latitude: 12.6841, longitude: 79.9836 },
      { name: 'Tirupathur', state: 'Tamil Nadu', latitude: 12.4958, longitude: 78.5678 },
      { name: 'Tenkasi', state: 'Tamil Nadu', latitude: 8.9594, longitude: 77.3151 },
      { name: 'Mayiladuthurai', state: 'Tamil Nadu', latitude: 11.1075, longitude: 79.6524 },
      { name: 'Nagapattinam', state: 'Tamil Nadu', latitude: 10.7672, longitude: 79.8449 },
      { name: 'Ariyalur', state: 'Tamil Nadu', latitude: 11.1401, longitude: 79.0786 },
      { name: 'Perambalur', state: 'Tamil Nadu', latitude: 11.2342, longitude: 78.8821 },
      { name: 'Tiruvarur', state: 'Tamil Nadu', latitude: 10.7725, longitude: 79.6365 },
      { name: 'Kallakurichi', state: 'Tamil Nadu', latitude: 11.7384, longitude: 78.9634 }
    ],
  },
  {
    name: 'Delhi (NCT)',
    code: 'DL',
    districts: [
      { name: 'Central Delhi', state: 'Delhi (NCT)', latitude: 28.6304, longitude: 77.2177 },
      { name: 'New Delhi', state: 'Delhi (NCT)', latitude: 28.6129, longitude: 77.2295 },
      { name: 'North Delhi', state: 'Delhi (NCT)', latitude: 28.6863, longitude: 77.2218 },
      { name: 'South Delhi', state: 'Delhi (NCT)', latitude: 28.5494, longitude: 77.2001 },
      { name: 'East Delhi (Anand Vihar)', state: 'Delhi (NCT)', latitude: 28.6469, longitude: 77.316 },
      { name: 'West Delhi (Punjabi Bagh)', state: 'Delhi (NCT)', latitude: 28.6692, longitude: 77.1264 },
      { name: 'Dwarka', state: 'Delhi (NCT)', latitude: 28.5921, longitude: 77.046 },
      { name: 'Rohini', state: 'Delhi (NCT)', latitude: 28.7495, longitude: 77.0565 },
      { name: 'Okhla', state: 'Delhi (NCT)', latitude: 28.5284, longitude: 77.2796 },
      { name: 'RK Puram', state: 'Delhi (NCT)', latitude: 28.5665, longitude: 77.1767 }
    ],
  },
  {
    name: 'Maharashtra',
    code: 'MH',
    districts: [
      { name: 'Mumbai', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
      { name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
      { name: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882 },
      { name: 'Thane', state: 'Maharashtra', latitude: 19.2183, longitude: 72.9781 },
      { name: 'Nashik', state: 'Maharashtra', latitude: 19.9975, longitude: 73.7898 },
      { name: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', latitude: 19.8762, longitude: 75.3433 },
      { name: 'Solapur', state: 'Maharashtra', latitude: 17.6599, longitude: 75.9064 },
      { name: 'Navi Mumbai', state: 'Maharashtra', latitude: 19.033, longitude: 73.0297 },
      { name: 'Kolhapur', state: 'Maharashtra', latitude: 16.705, longitude: 74.2433 },
      { name: 'Amravati', state: 'Maharashtra', latitude: 20.9374, longitude: 77.7796 },
      { name: 'Chandrapur', state: 'Maharashtra', latitude: 19.9615, longitude: 79.2961 }
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    districts: [
      { name: 'Bengaluru Urban', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
      { name: 'Mysuru', state: 'Karnataka', latitude: 12.2958, longitude: 76.6394 },
      { name: 'Mangaluru', state: 'Karnataka', latitude: 12.9141, longitude: 74.856 },
      { name: 'Hubballi-Dharwad', state: 'Karnataka', latitude: 15.3647, longitude: 75.124 },
      { name: 'Belagavi', state: 'Karnataka', latitude: 15.8497, longitude: 74.4977 },
      { name: 'Kalaburagi', state: 'Karnataka', latitude: 17.3297, longitude: 76.8343 },
      { name: 'Ballari', state: 'Karnataka', latitude: 15.1394, longitude: 76.9214 },
      { name: 'Shivamogga', state: 'Karnataka', latitude: 13.9299, longitude: 75.5681 },
      { name: 'Tumakuru', state: 'Karnataka', latitude: 13.3409, longitude: 77.101 },
      { name: 'Udupi', state: 'Karnataka', latitude: 13.3409, longitude: 74.7421 }
    ],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    districts: [
      { name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
      { name: 'Kanpur', state: 'Uttar Pradesh', latitude: 26.4499, longitude: 80.3319 },
      { name: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739 },
      { name: 'Agra', state: 'Uttar Pradesh', latitude: 27.1767, longitude: 78.0081 },
      { name: 'Noida (GB Nagar)', state: 'Uttar Pradesh', latitude: 28.5355, longitude: 77.391 },
      { name: 'Ghaziabad', state: 'Uttar Pradesh', latitude: 28.6692, longitude: 77.4538 },
      { name: 'Prayagraj', state: 'Uttar Pradesh', latitude: 25.4358, longitude: 81.8463 },
      { name: 'Meerut', state: 'Uttar Pradesh', latitude: 28.9845, longitude: 77.7064 },
      { name: 'Bareilly', state: 'Uttar Pradesh', latitude: 28.367, longitude: 79.4304 },
      { name: 'Gorakhpur', state: 'Uttar Pradesh', latitude: 26.7606, longitude: 83.3732 },
      { name: 'Mathura', state: 'Uttar Pradesh', latitude: 27.4924, longitude: 77.6737 }
    ],
  },
  {
    name: 'Kerala',
    code: 'KL',
    districts: [
      { name: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.5241, longitude: 76.9366 },
      { name: 'Kochi (Ernakulam)', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
      { name: 'Kozhikode', state: 'Kerala', latitude: 11.2588, longitude: 75.7804 },
      { name: 'Thrissur', state: 'Kerala', latitude: 10.5276, longitude: 76.2144 },
      { name: 'Kollam', state: 'Kerala', latitude: 8.8932, longitude: 76.6141 },
      { name: 'Kannur', state: 'Kerala', latitude: 11.8745, longitude: 75.3704 },
      { name: 'Palakkad', state: 'Kerala', latitude: 10.7867, longitude: 76.6548 },
      { name: 'Alappuzha', state: 'Kerala', latitude: 9.4981, longitude: 76.3388 },
      { name: 'Kottayam', state: 'Kerala', latitude: 9.5916, longitude: 76.5222 },
      { name: 'Wayanad', state: 'Kerala', latitude: 11.605, longitude: 76.0828 }
    ],
  },
  {
    name: 'Telangana',
    code: 'TG',
    districts: [
      { name: 'Hyderabad', state: 'Telangana', latitude: 17.385, longitude: 78.4867 },
      { name: 'Warangal', state: 'Telangana', latitude: 17.9689, longitude: 79.5941 },
      { name: 'Nizamabad', state: 'Telangana', latitude: 18.6725, longitude: 78.0941 },
      { name: 'Karimnagar', state: 'Telangana', latitude: 18.4386, longitude: 79.1288 },
      { name: 'Khammam', state: 'Telangana', latitude: 17.2473, longitude: 80.1514 },
      { name: 'Ramagundam', state: 'Telangana', latitude: 18.8016, longitude: 79.4549 }
    ],
  },
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    districts: [
      { name: 'Visakhapatnam', state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185 },
      { name: 'Vijayawada (NTR)', state: 'Andhra Pradesh', latitude: 16.5062, longitude: 80.648 },
      { name: 'Guntur', state: 'Andhra Pradesh', latitude: 16.3067, longitude: 80.4365 },
      { name: 'Tirupati', state: 'Andhra Pradesh', latitude: 13.6288, longitude: 79.4192 },
      { name: 'Nellore', state: 'Andhra Pradesh', latitude: 14.4426, longitude: 79.9865 },
      { name: 'Kurnool', state: 'Andhra Pradesh', latitude: 15.8281, longitude: 78.0373 },
      { name: 'Rajahmundry', state: 'Andhra Pradesh', latitude: 17.0005, longitude: 81.804 }
    ],
  },
  {
    name: 'West Bengal',
    code: 'WB',
    districts: [
      { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
      { name: 'Howrah', state: 'West Bengal', latitude: 22.5958, longitude: 88.2636 },
      { name: 'Siliguri (Darjeeling)', state: 'West Bengal', latitude: 26.7271, longitude: 88.3953 },
      { name: 'Durgapur', state: 'West Bengal', latitude: 23.5204, longitude: 87.3119 },
      { name: 'Asansol', state: 'West Bengal', latitude: 23.6739, longitude: 86.9524 }
    ],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    districts: [
      { name: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
      { name: 'Surat', state: 'Gujarat', latitude: 21.1702, longitude: 72.8311 },
      { name: 'Vadodara', state: 'Gujarat', latitude: 22.3072, longitude: 73.1812 },
      { name: 'Rajkot', state: 'Gujarat', latitude: 22.3039, longitude: 70.8022 },
      { name: 'Gandhinagar', state: 'Gujarat', latitude: 23.2156, longitude: 72.6369 },
      { name: 'Bhavnagar', state: 'Gujarat', latitude: 21.7645, longitude: 72.1519 },
      { name: 'Jamnagar', state: 'Gujarat', latitude: 22.4707, longitude: 70.0577 }
    ],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    districts: [
      { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
      { name: 'Jodhpur', state: 'Rajasthan', latitude: 26.2389, longitude: 73.0243 },
      { name: 'Kota', state: 'Rajasthan', latitude: 25.2138, longitude: 75.8648 },
      { name: 'Udaipur', state: 'Rajasthan', latitude: 24.5854, longitude: 73.7125 },
      { name: 'Ajmer', state: 'Rajasthan', latitude: 26.4499, longitude: 74.6399 },
      { name: 'Bhiwadi', state: 'Rajasthan', latitude: 28.2104, longitude: 76.8606 }
    ],
  },
  {
    name: 'Punjab',
    code: 'PB',
    districts: [
      { name: 'Ludhiana', state: 'Punjab', latitude: 30.901, longitude: 75.8573 },
      { name: 'Amritsar', state: 'Punjab', latitude: 31.634, longitude: 74.8723 },
      { name: 'Jalandhar', state: 'Punjab', latitude: 31.326, longitude: 75.5762 },
      { name: 'Patiala', state: 'Punjab', latitude: 30.3398, longitude: 76.3869 }
    ],
  },
  {
    name: 'Haryana',
    code: 'HR',
    districts: [
      { name: 'Gurugram', state: 'Haryana', latitude: 28.4595, longitude: 77.0266 },
      { name: 'Faridabad', state: 'Haryana', latitude: 28.4089, longitude: 77.3178 },
      { name: 'Panipat', state: 'Haryana', latitude: 29.3909, longitude: 76.9635 },
      { name: 'Karnal', state: 'Haryana', latitude: 29.6857, longitude: 76.9905 },
      { name: 'Rohtak', state: 'Haryana', latitude: 28.8955, longitude: 76.6066 }
    ],
  },
  {
    name: 'Chandigarh',
    code: 'CH',
    districts: [
      { name: 'Chandigarh', state: 'Chandigarh', latitude: 30.7333, longitude: 76.7794 }
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    districts: [
      { name: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
      { name: 'Indore', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577 },
      { name: 'Gwalior', state: 'Madhya Pradesh', latitude: 26.2183, longitude: 78.1828 },
      { name: 'Jabalpur', state: 'Madhya Pradesh', latitude: 23.1815, longitude: 79.9864 },
      { name: 'Ujjain', state: 'Madhya Pradesh', latitude: 23.1765, longitude: 75.7885 }
    ],
  },
  {
    name: 'Bihar',
    code: 'BR',
    districts: [
      { name: 'Patna', state: 'Bihar', latitude: 25.5941, longitude: 85.1376 },
      { name: 'Gaya', state: 'Bihar', latitude: 24.7914, longitude: 85.0002 },
      { name: 'Muzaffarpur', state: 'Bihar', latitude: 26.1209, longitude: 85.3647 },
      { name: 'Bhagalpur', state: 'Bihar', latitude: 25.2425, longitude: 86.9842 }
    ],
  },
  {
    name: 'Odisha',
    code: 'OD',
    districts: [
      { name: 'Bhubaneswar', state: 'Odisha', latitude: 20.2961, longitude: 85.8245 },
      { name: 'Cuttack', state: 'Odisha', latitude: 20.4625, longitude: 85.8828 },
      { name: 'Rourkela', state: 'Odisha', latitude: 22.2604, longitude: 84.8536 }
    ],
  },
  {
    name: 'Assam',
    code: 'AS',
    districts: [
      { name: 'Guwahati', state: 'Assam', latitude: 26.1445, longitude: 91.7362 },
      { name: 'Silchar', state: 'Assam', latitude: 24.8333, longitude: 92.7789 },
      { name: 'Dibrugarh', state: 'Assam', latitude: 27.4728, longitude: 94.912 }
    ],
  },
  {
    name: 'Jammu & Kashmir',
    code: 'JK',
    districts: [
      { name: 'Srinagar', state: 'Jammu & Kashmir', latitude: 34.0837, longitude: 74.7973 },
      { name: 'Jammu', state: 'Jammu & Kashmir', latitude: 32.7266, longitude: 74.857 }
    ],
  },
  {
    name: 'Goa',
    code: 'GA',
    districts: [
      { name: 'Panaji', state: 'Goa', latitude: 15.4909, longitude: 73.8278 },
      { name: 'Margao', state: 'Goa', latitude: 15.2832, longitude: 73.9862 }
    ],
  },
  {
    name: 'Uttarakhand',
    code: 'UK',
    districts: [
      { name: 'Dehradun', state: 'Uttarakhand', latitude: 30.3165, longitude: 78.0322 },
      { name: 'Haridwar', state: 'Uttarakhand', latitude: 29.9457, longitude: 78.1642 },
      { name: 'Rishikesh', state: 'Uttarakhand', latitude: 30.0869, longitude: 78.2676 }
    ],
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    districts: [
      { name: 'Shimla', state: 'Himachal Pradesh', latitude: 31.1048, longitude: 77.1734 },
      { name: 'Dharamshala', state: 'Himachal Pradesh', latitude: 32.219, longitude: 76.3234 }
    ],
  }
];
