import React, { useState } from 'react';

const LegalDocumentStep = ({ formData, updateFormData, errors }) => {
 const [dragStates, setDragStates] = useState({
 businessLicense: false,
 foodSafetyLicense: false,
 ownerIdProof: false
 });

 const handleInputChange = (field, value) => {
 updateFormData({ [field]: value });
 };

 const handleFileUpload = (field, file) => {
 if (file) {
 // Validate file type
 const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
 if (!allowedTypes.includes(file.type)) {
 alert('Please upload only JPEG, PNG, or PDF files');
 return;
 }

 // Validate file size (5MB limit)
 if (file.size > 5 * 1024 * 1024) {
 alert('File size must be less than 5MB');
 return;
 }

 updateFormData({ [field]: file });
 }
 };

 const handleDragOver = (e, field) => {
 e.preventDefault();
 setDragStates(prev => ({ ...prev, [field]: true }));
 };

 const handleDragLeave = (e, field) => {
 e.preventDefault();
 setDragStates(prev => ({ ...prev, [field]: false }));
 };

 const handleDrop = (e, field) => {
 e.preventDefault();
 setDragStates(prev => ({ ...prev, [field]: false }));

 const files = Array.from(e.dataTransfer.files);
 if (files.length > 0) {
 handleFileUpload(field, files[0]);
 }
 };

 const FileUploadArea = ({ field, label, required = false, description }) => (
 <div className="form-group">
 <label>
 {label} {required && <span className="required">*</span>}
 </label>
 {description && <p className="field-description">{description}</p>}

 <div
 className={`file-upload-area ${dragStates[field] ? 'drag-over' : ''} ${
 errors[field] ? 'error' : ''
 }`}
 onDragOver={(e) => handleDragOver(e, field)}
 onDragLeave={(e) => handleDragLeave(e, field)}
 onDrop={(e) => handleDrop(e, field)}
 onClick={() => document.getElementById(field).click()}
 >
 <input
 type="file"
 id={field}
 accept=".jpg,.jpeg,.png,.pdf"
 onChange={(e) => handleFileUpload(field, e.target.files[0])}
 style={{ display: 'none' }}
 />

 {formData[field] ? (
 <div className="file-selected">
 <div className="file-info">
 <span className="file-icon"></span>
 <div className="file-details">
 <div className="file-name">{formData[field].name}</div>
 <div className="file-size">
 {(formData[field].size / 1024 / 1024).toFixed(2)} MB
 </div>
 </div>
 </div>
 <button
 type="button"
 className="file-remove"
 onClick={(e) => {
 e.stopPropagation();
 updateFormData({ [field]: null });
 }}
 >
 
 </button>
 </div>
 ) : (
 <div className="file-upload-placeholder">
 <span className="upload-icon"></span>
 <div className="upload-text">
 <div>Drag and drop your file here or click to browse</div>
 <div className="upload-formats">Supports: JPEG, PNG, PDF (Max 5MB)</div>
 </div>
 </div>
 )}
 </div>

 {errors[field] && <span className="error-text">{errors[field]}</span>}
 </div>
 );

 return (
 <div className="step-content legal-document-step">
 <div className="step-header">
 <h2>Legal Documentation & Verification</h2>
 <p>Please provide the required legal documents for verification</p>
 </div>

 <div className="form-grid">
 {/* Business License */}
 <FileUploadArea
 field="businessLicense"
 label="Business License"
 required
 description="Upload a clear copy of your business license"
 />

 {/* Food Safety License */}
 <FileUploadArea
 field="foodSafetyLicense"
 label="Food Safety/Health Permit"
 required
 description="Upload your food safety certificate or health department permit"
 />

 {/* Tax ID */}
 <div className="form-group">
 <label htmlFor="taxId">
 Tax ID/EIN <span className="required">*</span>
 </label>
 <input
 type="text"
 id="taxId"
 value={formData.taxId || ''}
 onChange={(e) => handleInputChange('taxId', e.target.value)}
 placeholder="XX-XXXXXXX"
 className={errors.taxId ? 'error' : ''}
 />
 {errors.taxId && <span className="error-text">{errors.taxId}</span>}
 </div>

 {/* Business Registration Number */}
 <div className="form-group">
 <label htmlFor="registrationNumber">
 Business Registration Number <span className="required">*</span>
 </label>
 <input
 type="text"
 id="registrationNumber"
 value={formData.registrationNumber || ''}
 onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
 placeholder="Enter your business registration number"
 className={errors.registrationNumber ? 'error' : ''}
 />
 {errors.registrationNumber && (
 <span className="error-text">{errors.registrationNumber}</span>
 )}
 </div>

 {/* Owner Name */}
 <div className="form-group">
 <label htmlFor="ownerName">
 Owner/Manager Full Name <span className="required">*</span>
 </label>
 <input
 type="text"
 id="ownerName"
 value={formData.ownerName || ''}
 onChange={(e) => handleInputChange('ownerName', e.target.value)}
 placeholder="Enter the owner or manager's full name"
 className={errors.ownerName ? 'error' : ''}
 />
 {errors.ownerName && <span className="error-text">{errors.ownerName}</span>}
 </div>

 {/* Owner ID Proof */}
 <div className="form-group full-width">
 <FileUploadArea
 field="ownerIdProof"
 label="Owner ID Verification"
 required
 description="Upload a government-issued ID (Driver's License, Passport, etc.)"
 />
 </div>
 </div>

 {/* Important Notes */}
 <div className="important-notes">
 <h3>Important Information</h3>
 <div className="notes-grid">
 <div className="note-item">
 <h4>Document Requirements</h4>
 <ul>
 <li>All documents must be current and valid</li>
 <li>Images should be clear and readable</li>
 <li>Business name must match across all documents</li>
 <li>Owner ID must match the name provided</li>
 </ul>
 </div>

 <div className="note-item">
 <h4>Verification Process</h4>
 <ul>
 <li>Documents are reviewed within 24-48 hours</li>
 <li>You'll receive email notifications on status</li>
 <li>Additional documents may be requested if needed</li>
 <li>Account activation upon successful verification</li>
 </ul>
 </div>
 </div>
 </div>

 {/* Security Notice */}
 <div className="security-notice">
 <div className="security-icon"></div>
 <div className="security-text">
 <strong>Your Privacy is Protected:</strong> All uploaded documents are encrypted and stored securely.
 We only use this information for verification purposes and comply with all data protection regulations.
 </div>
 </div>
 </div>
 );
};

export default LegalDocumentStep;
