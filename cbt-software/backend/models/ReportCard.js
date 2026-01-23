const mongoose = require('mongoose');

const ReportCardSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  studentRoll: { type: String }, // Roll number/ID
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  className: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  
  // Academic Period
  academicTerm: { type: String }, // e.g., "Term 1", "Semester 1"
  academicYear: { type: String }, // e.g., "2025-2026"
  
  // Overall Performance
  overallGPA: { type: Number, default: 0 },
  overallGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'F' },
  overallRanking: { type: Number }, // Position in class
  totalTestsTaken: { type: Number, default: 0 },
  averagePercentage: { type: Number, default: 0 },
  
  // Subject Grades
  subjectGrades: [
    {
      subject: { type: String, required: true },
      grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'F' },
      percentage: { type: Number, default: 0 },
      totalTests: { type: Number, default: 0 },
      totalMarks: { type: Number, default: 0 },
      obtainedMarks: { type: Number, default: 0 },
      remarks: { type: String }, // Pass/Fail/Good/Excellent
      comment: { type: String }, // Teacher's comment for subject
      performanceStatus: { type: String, enum: ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'] }
    }
  ],
  
  // Detailed Test Breakdown by Subject
  testBreakdown: [
    {
      subject: { type: String },
      tests: [
        {
          testName: { type: String },
          testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
          date: { type: Date },
          marksObtained: { type: Number },
          totalMarks: { type: Number },
          percentage: { type: Number },
          grade: { type: String },
          status: { type: String, enum: ['Pass', 'Fail'] }
        }
      ]
    }
  ],
  
  // Attendance (if tracked)
  attendance: {
    totalClasses: { type: Number, default: 0 },
    classesAttended: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 }
  },
  
  // Conduct & Behavior
  conduct: {
    grade: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'] },
    remarks: { type: String }
  },
  
  // Overall Comments
  principalRemarks: { type: String },
  teacherRemarks: { type: String },
  parentalComment: { type: String },
  
  // Report Card Status
  isApproved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  
  // Meta
  generatedAt: { type: Date, default: Date.now },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date }, // When made visible to parents
  isPublished: { type: Boolean, default: false }
});

module.exports = mongoose.model('ReportCard', ReportCardSchema);
