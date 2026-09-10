const fs = require('fs');

let dbml = fs.readFileSync('schema.dbml', 'utf8');

const tablesToRemove = [
    'Role',
    'Otp',
    'FoodRefreshToken',
    'CustomerProfile',
    'DeliveryProfile',
    'User'
];

for (const table of tablesToRemove) {
    const regex = new RegExp(`Table ${table} \\{[^}]+\\}\\n*`, 'g');
    dbml = dbml.replace(regex, '');
}

const newTables = `
Table User {
  id ObjectId [pk]
  email String [unique, note: 'sparse']
  mobile String [unique, not null]
  password String
  loginType String [note: 'enum: PASSWORD, OTP, GOOGLE, APPLE, default: OTP']
  primaryRole ObjectId [ref: > Role.id]
  emailVerified Boolean [default: false]
  mobileVerified Boolean [default: false]
  isActive Boolean [default: true]
  isBlocked Boolean [default: false]
  isDeleted Boolean [default: false]
  failedLoginAttempts Number [default: 0]
  lockUntil Date
  lastLoginAt Date
  createdAt Date
  updatedAt Date
}

Table Profile {
  id ObjectId [pk]
  userId ObjectId [unique, not null, ref: - User.id]
  firstName String
  lastName String
  profilePhoto String
  gender String [note: 'enum: MALE, FEMALE, OTHER']
  dob Date
  phone String
  alternatePhone String
  addressLine1 String
  addressLine2 String
  city String
  state String
  country String
  pincode String
  language String
  timezone String
  createdAt Date
  updatedAt Date
}

Table Role {
  id ObjectId [pk]
  code String [unique]
  name String
  description String
  isSystemRole Boolean [default: true]
  createdAt Date
  updatedAt Date
}

Table UserRole {
  id ObjectId [pk]
  userId ObjectId [not null, ref: > User.id]
  roleId ObjectId [not null, ref: > Role.id]
  franchiseId ObjectId
  storeId ObjectId
  assignedBy ObjectId [ref: > User.id]
  assignedAt Date [default: \`Date.now\`]
  isPrimary Boolean [default: false]
  status String [note: 'enum: ACTIVE, SUSPENDED, REMOVED, default: ACTIVE']
  createdAt Date
  updatedAt Date
}

Table RefreshToken {
  id ObjectId [pk]
  userId ObjectId [ref: > User.id]
  token String
  deviceId String
  expiresAt Date
  revoked Boolean [default: false]
  createdAt Date
  updatedAt Date
}

Table UserSession {
  id ObjectId [pk]
  userId ObjectId [ref: > User.id]
  refreshTokenId ObjectId [ref: > RefreshToken.id]
  activeRoleId ObjectId [ref: > Role.id]
  franchiseId ObjectId
  storeId ObjectId
  device String
  browser String
  os String
  ipAddress String
  lastActivity Date
  expiresAt Date
  isActive Boolean [default: true]
  createdAt Date
  updatedAt Date
}

Table OtpVerification {
  id ObjectId [pk]
  mobile String
  email String
  otp String
  purpose String [note: 'enum: LOGIN, REGISTER, RESET_PASSWORD, CHANGE_PHONE, CHANGE_EMAIL']
  attempts Number [default: 0]
  expiresAt Date
  verified Boolean [default: false]
  createdAt Date
  updatedAt Date
}

Table LoginHistory {
  id ObjectId [pk]
  userId ObjectId [ref: > User.id]
  roleId ObjectId [ref: > Role.id]
  loginAt Date
  logoutAt Date
  ipAddress String
  browser String
  os String
  device String
  status String [note: 'enum: SUCCESS, FAILED, LOGOUT']
  location String
  createdAt Date
  updatedAt Date
}

Table CustomerProfile {
  id ObjectId [pk]
  userId ObjectId [unique, ref: - User.id]
  referralCode String
  loyaltyTier String
  walletId ObjectId
  defaultAddressId ObjectId
  createdAt Date
  updatedAt Date
}

Table DeliveryProfile {
  id ObjectId [pk]
  userId ObjectId [unique, ref: - User.id]
  vehicleType String
  vehicleNumber String
  drivingLicense String
  aadhaarNumber String
  currentStoreId ObjectId
  isOnline Boolean [default: false]
  createdAt Date
  updatedAt Date
}
`;

dbml += newTables;

fs.writeFileSync('schema.dbml', dbml);
console.log('Schema updated successfully.');
