'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, Legend
} from 'recharts';

// ─────────────────────────────────────────────
// TYPES — Original
// ─────────────────────────────────────────────
interface Passage {
  id: string; text: string; language: string; level: string; created_at: string;
}
interface StudentProfile {
  id: string; full_name: string | null; email: string | null; created_at: string;
}
interface TestMetrics { total_tests: number; avg_wpm: number; avg_accuracy: number; }
interface TestResult { user_id: string; wpm: number; accuracy: number; created_at: string; }

// ─────────────────────────────────────────────
// TYPES — Institute
// ─────────────────────────────────────────────
interface InstituteStudent {
  id: string; full_name: string; phone: string; course: string;
  batch_slot: string; join_date: string; status: 'active' | 'archived'; created_at: string;
}
interface AttendanceLog {
  id: string; student_id: string; status: 'P' | 'A' | 'L';
  attendance_date: string; batch_slot: string;
}
interface InstituteSettings {
  institute_name: string; primary_admin_phone: string; secondary_admin_phone: string;
  active_admin_phone: string; courses: string[]; absence_template: string; fee_template: string;
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const BATCH_SLOTS = [
  '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM',
  '4:00 PM','5:00 PM','6:00 PM','7:00 PM','Flexible'
];

const COURSES = [
  'Typewriting - English Junior',
  'Typewriting - English Senior',
  'Typewriting - Tamil Junior',
  'Typewriting - Tamil Senior',
  'COA',
  'Tally',
  'Shorthand',
];

const COURSE_CAPACITY: Record<string, number | undefined> = {
  'Typewriting - English Junior': 13,
  'Typewriting - English Senior': 13,
  'Typewriting - Tamil Junior': 5,
  'Typewriting - Tamil Senior': 5,
  'COA': 7,
  'Tally': 7,
  'Shorthand': undefined,
};

const COURSE_GROUPS = [
  { group: 'Typewriting', items: ['Typewriting - English Junior','Typewriting - English Senior','Typewriting - Tamil Junior','Typewriting - Tamil Senior'] },
  { group: 'Other', items: ['COA','Tally','Shorthand'] },
];

const DEFAULT_SETTINGS: InstituteSettings = {
  institute_name: 'LAKSHMI TECHNICAL INSTITUTE',
  primary_admin_phone: '8973120153',
  secondary_admin_phone: '7397161516',
  active_admin_phone: '8973120153',
  courses: COURSES,
  absence_template: 'Hi {name}, you were absent on {date} for your {course} class at {institute}. Please attend regularly.',
  fee_template: 'Hi {name}, your monthly fee for {course} at {institute} is due. Kindly pay at the earliest. Thank you!',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function todayISO(): string { return new Date().toISOString().split('T')[0]; }

function ensureSheetJS(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).XLSX) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

// ─────────────────────────────────────────────
// INSTITUTE MODULE
// ─────────────────────────────────────────────
function InstituteModule() {
  const [instituteTab, setInstituteTab] = useState<
    'dashboard' | 'attendance' | 'students' | 'reports' | 'settings'
  >('dashboard');

  const [instStudents, setInstStudents] = useState<InstituteStudent[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [settings, setSettings] = useState<InstituteSettings>(DEFAULT_SETTINGS);
  const [loadingInst, setLoadingInst] = useState(true);
  const [instError, setInstError] = useState<string | null>(null);

  const [attDate, setAttDate] = useState(todayISO());
  const [attSlot, setAttSlot] = useState('6:00 AM');
  const [attMap, setAttMap] = useState<Record<string, 'P' | 'A' | 'L'>>({});
  const [savingAtt, setSavingAtt] = useState(false);
  const [attSaved, setAttSaved] = useState(false);
  const [holidayInput, setHolidayInput] = useState('');

  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<{ course: string; slot: string; status: string }>({ course: '', slot: '', status: 'active' });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<InstituteStudent | null>(null);
  const [studentForm, setStudentForm] = useState({
    full_name: '', phone: '', course: COURSES[0], batch_slot: BATCH_SLOTS[0],
    join_date: todayISO(), status: 'active' as 'active' | 'archived'
  });
  const [savingStudent, setSavingStudent] = useState(false);

  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportCourse, setReportCourse] = useState('');
  const [reportSlot, setReportSlot] = useState('');

  const [settingsForm, setSettingsForm] = useState<InstituteSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => { loadAllInstituteData(); }, []);

  async function loadAllInstituteData() {
    setLoadingInst(true); setInstError(null);
    try {
      const [studRes, attRes, settRes] = await Promise.all([
        supabase.from('institute_students').select('*').order('created_at', { ascending: false }),
        supabase.from('attendance_logs').select('*').order('attendance_date', { ascending: false }),
        supabase.from('institute_management_settings').select('*').eq('id', 1).single(),
      ]);
      if (studRes.error) throw studRes.error;
      if (attRes.error) throw attRes.error;
      setInstStudents((studRes.data as InstituteStudent[]) || []);
      setAttendanceLogs((attRes.data as AttendanceLog[]) || []);
      if (settRes.data && !settRes.error) {
        const s = settRes.data as InstituteSettings;
        setSettings(s); setSettingsForm(s);
      }
    } catch (err: any) {
      setInstError(err.message || 'Failed to load institute data');
    } finally { setLoadingInst(false); }
  }

  useEffect(() => {
    const existing: Record<string, 'P' | 'A' | 'L'> = {};
    attendanceLogs
      .filter(l => l.attendance_date === attDate && l.batch_slot === attSlot)
      .forEach(l => { existing[l.student_id] = l.status as 'P' | 'A' | 'L'; });
    setAttMap(existing); setAttSaved(false);
  }, [attDate, attSlot, attendanceLogs]);

  const studentsForSlot = instStudents.filter(s =>
    s.status === 'active' && (s.batch_slot === attSlot || s.batch_slot === 'Flexible')
  );

  async function saveAttendance() {
    setSavingAtt(true);
    try {
      await supabase.from('attendance_logs').delete().eq('attendance_date', attDate).eq('batch_slot', attSlot);
      const rows = studentsForSlot.map(s => ({
        student_id: s.id, status: attMap[s.id] || 'A', attendance_date: attDate, batch_slot: attSlot,
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('attendance_logs').insert(rows);
        if (error) throw error;
      }
      const { data } = await supabase.from('attendance_logs').select('*').order('attendance_date', { ascending: false });
      setAttendanceLogs((data as AttendanceLog[]) || []);
      setAttSaved(true);
    } catch (err: any) { alert('Error saving: ' + err.message); }
    finally { setSavingAtt(false); }
  }

  function getConsecutiveAbsences(studentId: string): number {
    const logs = attendanceLogs
      .filter(l => l.student_id === studentId)
      .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());
    let streak = 0;
    for (const log of logs) { if (log.status === 'A') streak++; else break; }
    return streak;
  }

  const flaggedStudents = instStudents
    .filter(s => s.status === 'active')
    .map(s => ({ ...s, streak: getConsecutiveAbsences(s.id) }))
    .filter(s => s.streak >= 3);

  function openAddStudent() {
    setEditingStudent(null);
    setStudentForm({ full_name: '', phone: '', course: COURSES[0], batch_slot: BATCH_SLOTS[0], join_date: todayISO(), status: 'active' });
    setShowAddStudent(true);
  }
  function openEditStudent(s: InstituteStudent) {
    setEditingStudent(s);
    setStudentForm({ full_name: s.full_name, phone: s.phone, course: s.course, batch_slot: s.batch_slot, join_date: s.join_date, status: s.status });
    setShowAddStudent(true);
  }
  async function saveStudent() {
    if (!studentForm.full_name.trim() || !studentForm.phone.trim()) { alert('Name and phone required.'); return; }
    if (!/^\d{10}$/.test(studentForm.phone)) { alert('Phone must be 10 digits.'); return; }
    setSavingStudent(true);
    try {
      if (editingStudent) {
        const { error } = await supabase.from('institute_students').update(studentForm).eq('id', editingStudent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('institute_students').insert([studentForm]);
        if (error) throw error;
      }
      setShowAddStudent(false);
      const { data } = await supabase.from('institute_students').select('*').order('created_at', { ascending: false });
      setInstStudents((data as InstituteStudent[]) || []);
    } catch (err: any) { alert('Error saving student: ' + err.message); }
    finally { setSavingStudent(false); }
  }
  async function archiveStudent(id: string) {
    if (!confirm('Archive this student?')) return;
    await supabase.from('institute_students').update({ status: 'archived' }).eq('id', id);
    setInstStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'archived' } : s));
  }
  async function restoreStudent(id: string) {
    await supabase.from('institute_students').update({ status: 'active' }).eq('id', id);
    setInstStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
  }
  async function deleteStudent(id: string) {
    if (!confirm('Permanently delete student and all records? Cannot undo.')) return;
    await supabase.from('institute_students').delete().eq('id', id);
    setInstStudents(prev => prev.filter(s => s.id !== id));
  }

  const filteredInstStudents = instStudents.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || s.phone.includes(studentSearch);
    const matchCourse = !studentFilter.course || s.course === studentFilter.course;
    const matchSlot = !studentFilter.slot || s.batch_slot === studentFilter.slot;
    const matchStatus = !studentFilter.status || s.status === studentFilter.status;
    return matchSearch && matchCourse && matchSlot && matchStatus;
  });

  function getWorkingDays(year: number, month: number): string[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) =>
      `${year}-${String(month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
    ).filter(d => !holidays.includes(d));
  }

  function getReportData() {
    const [year, month] = reportMonth.split('-').map(Number);
    const workingDays = getWorkingDays(year, month);
    const relevantStudents = instStudents.filter(s => {
      const matchCourse = !reportCourse || s.course === reportCourse;
      const matchSlot = !reportSlot || s.batch_slot === reportSlot;
      return matchCourse && matchSlot;
    });
    return relevantStudents.map(s => {
      const studentLogs = attendanceLogs.filter(l => {
        const [ly, lm] = l.attendance_date.split('-').map(Number);
        return l.student_id === s.id && ly === year && lm === month;
      });
      const present = studentLogs.filter(l => l.status === 'P').length;
      const absent = studentLogs.filter(l => l.status === 'A').length;
      const late = studentLogs.filter(l => l.status === 'L').length;
      const total = workingDays.length || 1;
      const pct = Math.round(((present + late) / total) * 100);
      return { ...s, present, absent, late, total, pct };
    });
  }

  function printReport() {
    const data = getReportData();
    const rows = data.map(r => `
      <tr style="border-bottom:1px solid #e5e7eb;${r.pct < 75 ? 'background:#fff7ed;color:#c2410c;' : ''}">
        <td style="padding:8px 12px;">${r.full_name}</td>
        <td style="padding:8px 12px;">${r.course}</td>
        <td style="padding:8px 12px;">${r.batch_slot}</td>
        <td style="padding:8px 12px;text-align:center;">${r.present}</td>
        <td style="padding:8px 12px;text-align:center;">${r.absent}</td>
        <td style="padding:8px 12px;text-align:center;">${r.late}</td>
        <td style="padding:8px 12px;text-align:center;">${r.total}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;">${r.pct}%</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Attendance — ${reportMonth}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#111;}
        h2{margin:0 0 4px;}p{margin:0 0 16px;color:#555;font-size:13px;}
        table{width:100%;border-collapse:collapse;}
        th{background:#1e293b;color:#fff;padding:10px 12px;text-align:left;font-size:12px;}
        td{font-size:12px;}
        @media print{button{display:none;}}
      </style></head>
      <body>
        <h2>${settings.institute_name}</h2>
        <p>Monthly Attendance Report — ${reportMonth}${reportCourse ? ' | ' + reportCourse : ''}${reportSlot ? ' | ' + reportSlot : ''}</p>
        <table>
          <thead><tr><th>Name</th><th>Course</th><th>Slot</th><th>Present</th><th>Absent</th><th>Late</th><th>Working Days</th><th>Attendance %</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:11px;color:#94a3b8;">⚠️ Orange rows = below 75% attendance.</p>
        <button onclick="window.print()" style="margin-top:12px;padding:8px 20px;background:#1e293b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🖨️ Print / Save PDF</button>
      </body></html>`);
  }

  async function exportExcel() {
    await ensureSheetJS();
    const XLSX = (window as any).XLSX;
    const data = getReportData();

    const summaryRows = [
      ['Name', 'Course', 'Batch Slot', 'Join Date', 'Status', 'Present', 'Absent', 'Late', 'Working Days', 'Attendance %'],
      ...data.map(r => [r.full_name, r.course, r.batch_slot, r.join_date, r.status, r.present, r.absent, r.late, r.total, r.pct / 100])
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1['!cols'] = [{ wch: 22 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 9 }, { wch: 9 }, { wch: 6 }, { wch: 14 }, { wch: 14 }];
    data.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: 9 });
      if (ws1[cellRef]) ws1[cellRef].z = '0%';
    });

    const lowRows = data.filter(r => r.pct < 75);
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['⚠️ Students Below 75% Attendance — ' + reportMonth],
      ['Name', 'Course', 'Slot', 'Attendance %'],
      ...lowRows.map(r => [r.full_name, r.course, r.batch_slot, r.pct / 100])
    ]);
    ws2['!cols'] = [{ wch: 22 }, { wch: 30 }, { wch: 12 }, { wch: 14 }];
    if (lowRows.length > 0) {
      lowRows.forEach((_, i) => {
        const cellRef = XLSX.utils.encode_cell({ r: i + 2, c: 3 });
        if (ws2[cellRef]) ws2[cellRef].z = '0%';
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Attendance');
    XLSX.utils.book_append_sheet(wb, ws2, 'Low Attendance');
    XLSX.writeFile(wb, `LTI_Attendance_${reportMonth}.xlsx`);
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const { error } = await supabase.from('institute_management_settings').update(settingsForm).eq('id', 1);
      if (error) throw error;
      setSettings(settingsForm); setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: any) { alert('Error saving settings: ' + err.message); }
    finally { setSavingSettings(false); }
  }

  function exportBackup() {
    const payload = { instStudents, attendanceLogs, holidays, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `lti_backup_${todayISO()}.json`; a.click();
  }

  // ── Dashboard analytics ──
  const activeStudents = instStudents.filter(s => s.status === 'active');
  const archivedStudents = instStudents.filter(s => s.status === 'archived');

  const thisMonth = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const topStudents = activeStudents.map(s => {
    const [year, month] = thisMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const logs = attendanceLogs.filter(l => {
      const [ly, lm] = l.attendance_date.split('-').map(Number);
      return l.student_id === s.id && ly === year && lm === month;
    });
    const pct = daysInMonth > 0 ? Math.round(((logs.filter(l => l.status === 'P' || l.status === 'L').length) / daysInMonth) * 100) : 0;
    return { ...s, pct };
  }).sort((a, b) => b.pct - a.pct).slice(0, 3);

  const lowAttendanceStudents = activeStudents.map(s => {
    const [year, month] = thisMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const logs = attendanceLogs.filter(l => {
      const [ly, lm] = l.attendance_date.split('-').map(Number);
      return l.student_id === s.id && ly === year && lm === month;
    });
    const pct = daysInMonth > 0 ? Math.round(((logs.filter(l => l.status === 'P' || l.status === 'L').length) / daysInMonth) * 100) : 0;
    return { ...s, pct };
  }).filter(s => s.pct < 75 && s.pct > 0);

  const slotUtilData = BATCH_SLOTS.filter(s => s !== 'Flexible').map(slot => {
    const count = activeStudents.filter(s => s.batch_slot === slot || s.batch_slot === 'Flexible').length;
    return { slot: slot.replace(':00 ', ''), count };
  });

  const courseDistribution = COURSES.map(c => ({
    course: c.replace('Typewriting - ', 'TW '),
    count: activeStudents.filter(s => s.course === c).length,
    capacity: COURSE_CAPACITY[c] ?? null,
  }));

  const courseAvgAttendance = COURSES.map(c => {
    const courseStudents = activeStudents.filter(s => s.course === c);
    if (courseStudents.length === 0) return null;
    const [year, month] = thisMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const avg = courseStudents.reduce((acc, s) => {
      const logs = attendanceLogs.filter(l => {
        const [ly, lm] = l.attendance_date.split('-').map(Number);
        return l.student_id === s.id && ly === year && lm === month;
      });
      const pct = daysInMonth > 0 ? Math.round(((logs.filter(l => l.status === 'P' || l.status === 'L').length) / daysInMonth) * 100) : 0;
      return acc + pct;
    }, 0) / courseStudents.length;
    return { course: c.replace('Typewriting - ', 'TW '), avg: Math.round(avg) };
  }).filter(Boolean) as { course: string; avg: number }[];

  const monthlyTrendData = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const [year, month] = ym.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const studentsWithData = activeStudents.filter(s =>
        attendanceLogs.some(l => {
          const [ly, lm] = l.attendance_date.split('-').map(Number);
          return l.student_id === s.id && ly === year && lm === month;
        })
      );
      if (studentsWithData.length === 0) return { label, avg: 0 };
      const avg = studentsWithData.reduce((acc, s) => {
        const logs = attendanceLogs.filter(l => {
          const [ly, lm] = l.attendance_date.split('-').map(Number);
          return l.student_id === s.id && ly === year && lm === month;
        });
        const pct = daysInMonth > 0 ? Math.round(((logs.filter(l => l.status === 'P' || l.status === 'L').length) / daysInMonth) * 100) : 0;
        return acc + pct;
      }, 0) / studentsWithData.length;
      return { label, avg: Math.round(avg) };
    });
  })();

  const monthlyGrowthData = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const joined = instStudents.filter(s => s.join_date?.startsWith(ym)).length;
      const left = instStudents.filter(s => s.status === 'archived' && s.created_at?.startsWith(ym)).length;
      return { label, joined, left };
    });
  })();

  if (loadingInst) return <div className="flex items-center justify-center py-24 text-slate-400 animate-pulse">Loading institute data...</div>;
  if (instError) return <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">⚠️ {instError} — <button onClick={loadAllInstituteData} className="underline">Retry</button></div>;

  return (
    <div className="space-y-6">

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
        {([
          { id: 'dashboard', label: '🏠 Dashboard' },
          { id: 'attendance', label: '✅ Attendance' },
          { id: 'students', label: '👥 Students' },
          { id: 'reports', label: '📊 Reports' },
          { id: 'settings', label: '⚙️ Settings' },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setInstituteTab(tab.id)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${instituteTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════ DASHBOARD ══════════════ */}
      {instituteTab === 'dashboard' && (
        <div className="space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Students', value: activeStudents.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
              { label: 'Archived', value: archivedStudents.length, color: 'text-slate-400', bg: 'bg-white/5 border-white/10' },
              { label: 'Courses', value: COURSES.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Flagged Absences', value: flaggedStudents.length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            ].map(card => (
              <div key={card.label} className={`${card.bg} border rounded-xl p-5`}>
                <div className={`text-3xl font-extrabold ${card.color}`}>{card.value}</div>
                <div className="text-slate-400 text-xs mt-1 font-medium">{card.label}</div>
              </div>
            ))}
          </div>

          {flaggedStudents.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <h3 className="text-red-400 font-bold text-sm mb-3">🚨 Consecutive Absence Alert (3+ days)</h3>
              <div className="space-y-2">
                {flaggedStudents.map(s => (
                  <div key={s.id} className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-white">{s.full_name}</span>
                    <span className="text-slate-400 text-xs">{s.course} · {s.batch_slot}</span>
                    <span className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full font-bold">{s.streak} days absent</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowAttendanceStudents.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
              <h3 className="text-amber-400 font-bold text-sm mb-3">⚠️ Below 75% — This Month ({lowAttendanceStudents.length} students)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {lowAttendanceStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-white text-sm font-semibold">{s.full_name}</div>
                      <div className="text-slate-400 text-xs">{s.course}</div>
                    </div>
                    <span className="text-amber-400 font-extrabold text-sm">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4 text-sm">🏆 Top Attendance — This Month</h3>
              {topStudents.length === 0 ? <p className="text-slate-500 text-sm">No attendance data yet.</p> : (
                <div className="space-y-3">
                  {topStudents.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className={`text-lg font-extrabold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : 'text-orange-400'}`}>#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-white">{s.full_name}</span>
                          <span className="text-emerald-400 font-bold">{s.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4 text-sm">📚 Course-wise Avg Attendance % — This Month</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseAvgAttendance} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" />
                    <XAxis dataKey="course" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v: any) => [`${v}%`, 'Avg Attendance']} />
                    <Bar dataKey="avg" name="Avg %" radius={[4, 4, 0, 0]}>
                      {courseAvgAttendance.map((entry, idx) => (
                        <Cell key={idx} fill={entry.avg < 75 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4 text-sm">📋 Course Enrollment vs Capacity</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseDistribution} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" />
                  <XAxis dataKey="course" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Bar dataKey="count" name="Enrolled" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="capacity" name="Max Capacity" fill="#374151" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-slate-500 text-xs mt-2">Shorthand has no capacity limit.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4 text-sm">⏰ Slot Utilization</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slotUtilData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" />
                  <XAxis dataKey="slot" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4 text-sm">📈 Monthly Attendance Trend — Last 6 Months</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v: any) => [`${v}%`, 'Avg Attendance']} />
                  <Line type="monotone" dataKey="avg" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', r: 4 }} name="Avg %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4 text-sm">📊 Student Growth — Last 6 Months</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyGrowthData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Bar dataKey="joined" name="Joined" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="left" name="Archived" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════ ATTENDANCE ══════════════ */}
      {instituteTab === 'attendance' && (
        <div className="space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Date</label>
              <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Batch Slot</label>
              <select value={attSlot} onChange={e => setAttSlot(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
                {BATCH_SLOTS.filter(s => s !== 'Flexible').map(s => (
                  <option key={s} value={s} className="bg-[#111827]">{s}</option>
                ))}
              </select>
            </div>
            {holidays.includes(attDate) && (
              <div className="px-4 py-2.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-sm font-semibold">
                🎉 Holiday — no attendance required
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => { const m: Record<string,'P'|'A'|'L'> = {}; studentsForSlot.forEach(s => { m[s.id] = 'P'; }); setAttMap(m); }}
              className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-lg text-sm font-bold transition-all">
              ✅ Mark All Present
            </button>
            <button onClick={() => { const m: Record<string,'P'|'A'|'L'> = {}; studentsForSlot.forEach(s => { m[s.id] = 'A'; }); setAttMap(m); }}
              className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-bold transition-all">
              ❌ Mark All Absent
            </button>
            <button onClick={saveAttendance} disabled={savingAtt || studentsForSlot.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ml-auto">
              {savingAtt ? 'Saving...' : attSaved ? '✅ Saved!' : '💾 Save Attendance'}
            </button>
          </div>

          {studentsForSlot.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-xl">No active students assigned to this slot.</div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Course</th>
                    <th className="px-6 py-3">Slot</th>
                    <th className="px-6 py-3 text-center">P / A / L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {studentsForSlot.map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 font-semibold text-white">{s.full_name}</td>
                      <td className="px-6 py-3 text-slate-400 text-sm">{s.course}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.batch_slot === 'Flexible' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                          {s.batch_slot}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2 justify-center">
                          {(['P','A','L'] as const).map(status => (
                            <button key={status} onClick={() => setAttMap(prev => ({ ...prev, [s.id]: status }))}
                              className={`w-9 h-9 rounded-lg text-sm font-extrabold transition-all ${(attMap[s.id] || 'A') === status
                                ? status === 'P' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                  : status === 'A' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                                  : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-bold mb-3 text-sm">🎉 Holiday Manager</h3>
            <div className="flex gap-3 mb-4">
              <input type="date" value={holidayInput} onChange={e => setHolidayInput(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
              <button onClick={() => { if (holidayInput && !holidays.includes(holidayInput)) { setHolidays(prev => [...prev, holidayInput].sort()); setHolidayInput(''); } }}
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">
                + Mark Holiday
              </button>
            </div>
            {holidays.length === 0 ? <p className="text-slate-500 text-sm">No holidays marked yet.</p> : (
              <div className="flex flex-wrap gap-2">
                {holidays.map(h => (
                  <div key={h} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                    <span className="text-amber-300 text-xs font-semibold">{formatDate(h)}</span>
                    <button onClick={() => setHolidays(prev => prev.filter(d => d !== h))} className="text-slate-400 hover:text-red-400 text-xs transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ STUDENTS ══════════════ */}
      {instituteTab === 'students' && (
        <div className="space-y-5">
          {showAddStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl w-full max-w-lg relative">
                <button onClick={() => setShowAddStudent(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">✖️</button>
                <h3 className="text-xl font-bold text-white mb-6">{editingStudent ? '✏️ Edit Student' : '➕ Add Student'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Full Name *</label>
                    <input type="text" value={studentForm.full_name} onChange={e => setStudentForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="e.g. Lakshmi Devi"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Phone * (10 digits)</label>
                    <input type="tel" value={studentForm.phone} onChange={e => setStudentForm(p => ({ ...p, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                      placeholder="9876543210"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Course *</label>
                      <select value={studentForm.course} onChange={e => setStudentForm(p => ({ ...p, course: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                        {COURSE_GROUPS.map(g => (
                          <optgroup key={g.group} label={g.group} className="bg-[#111827]">
                            {g.items.map(c => <option key={c} value={c} className="bg-[#111827]">{c}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Batch Slot *</label>
                      <select value={studentForm.batch_slot} onChange={e => setStudentForm(p => ({ ...p, batch_slot: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                        {BATCH_SLOTS.map(s => <option key={s} value={s} className="bg-[#111827]">{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Join Date</label>
                      <input type="date" value={studentForm.join_date} onChange={e => setStudentForm(p => ({ ...p, join_date: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Status</label>
                      <select value={studentForm.status} onChange={e => setStudentForm(p => ({ ...p, status: e.target.value as 'active' | 'archived' }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                        <option value="active" className="bg-[#111827]">Active</option>
                        <option value="archived" className="bg-[#111827]">Archived</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={saveStudent} disabled={savingStudent}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2">
                    {savingStudent ? 'Saving...' : editingStudent ? '✅ Update Student' : '➕ Add Student'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative flex-1">
              <input type="text" placeholder="Search name or phone..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select value={studentFilter.course} onChange={e => setStudentFilter(p => ({ ...p, course: e.target.value }))}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="" className="bg-[#111827]">All Courses</option>
              {COURSE_GROUPS.map(g => (
                <optgroup key={g.group} label={g.group} className="bg-[#111827]">
                  {g.items.map(c => <option key={c} value={c} className="bg-[#111827]">{c}</option>)}
                </optgroup>
              ))}
            </select>
            <select value={studentFilter.slot} onChange={e => setStudentFilter(p => ({ ...p, slot: e.target.value }))}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="" className="bg-[#111827]">All Slots</option>
              {BATCH_SLOTS.map(s => <option key={s} value={s} className="bg-[#111827]">{s}</option>)}
            </select>
            <select value={studentFilter.status} onChange={e => setStudentFilter(p => ({ ...p, status: e.target.value }))}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="active" className="bg-[#111827]">Active</option>
              <option value="archived" className="bg-[#111827]">Archived</option>
              <option value="" className="bg-[#111827]">All</option>
            </select>
            <button onClick={openAddStudent}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap">
              ➕ Add Student
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <span className="text-white font-bold text-sm">{filteredInstStudents.length} student{filteredInstStudents.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">Slot</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-white">
                  {filteredInstStudents.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-500">No students found.</td></tr>
                  ) : filteredInstStudents.map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-semibold">{s.full_name}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{s.phone}</td>
                      <td className="px-5 py-3 text-indigo-300 text-xs">{s.course}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.batch_slot === 'Flexible' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'}`}>{s.batch_slot}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{formatDate(s.join_date)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}>{s.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-center flex-wrap">
                          <button onClick={() => openEditStudent(s)} className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2.5 py-1 rounded-md text-xs font-bold transition-all">✏️ Edit</button>
                          {s.status === 'active'
                            ? <button onClick={() => archiveStudent(s.id)} className="bg-slate-500/20 hover:bg-slate-500/40 text-slate-300 px-2.5 py-1 rounded-md text-xs font-bold transition-all">📦 Archive</button>
                            : <button onClick={() => restoreStudent(s.id)} className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-md text-xs font-bold transition-all">♻️ Restore</button>
                          }
                          <button onClick={() => deleteStudent(s.id)} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2.5 py-1 rounded-md text-xs font-bold transition-all">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ REPORTS ══════════════ */}
      {instituteTab === 'reports' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end flex-wrap">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Month</label>
              <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Course</label>
              <select value={reportCourse} onChange={e => setReportCourse(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="" className="bg-[#111827]">All Courses</option>
                {COURSE_GROUPS.map(g => (
                  <optgroup key={g.group} label={g.group} className="bg-[#111827]">
                    {g.items.map(c => <option key={c} value={c} className="bg-[#111827]">{c}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Slot</label>
              <select value={reportSlot} onChange={e => setReportSlot(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="" className="bg-[#111827]">All Slots</option>
                {BATCH_SLOTS.map(s => <option key={s} value={s} className="bg-[#111827]">{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <button onClick={printReport}
                className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all">
                🖨️ PDF / Print
              </button>
              <button onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all">
                📥 Excel (.xlsx)
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">Slot</th>
                    <th className="px-5 py-3 text-center">Present</th>
                    <th className="px-5 py-3 text-center">Absent</th>
                    <th className="px-5 py-3 text-center">Late</th>
                    <th className="px-5 py-3 text-center">Working Days</th>
                    <th className="px-5 py-3 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {getReportData().length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-500">No data for selected filters.</td></tr>
                  ) : getReportData().map(s => (
                    <tr key={s.id} className={`transition-colors hover:bg-white/5 ${s.pct < 75 ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-5 py-3 font-semibold text-white">{s.full_name}</td>
                      <td className="px-5 py-3 text-indigo-300 text-xs">{s.course}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{s.batch_slot}</td>
                      <td className="px-5 py-3 text-center text-emerald-400 font-bold">{s.present}</td>
                      <td className="px-5 py-3 text-center text-red-400 font-bold">{s.absent}</td>
                      <td className="px-5 py-3 text-center text-amber-400 font-bold">{s.late}</td>
                      <td className="px-5 py-3 text-center text-slate-400">{s.total}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`font-extrabold ${s.pct >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>{s.pct}%</span>
                        {s.pct < 75 && <span className="ml-1 text-xs text-amber-500">⚠️</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-white/10 text-xs text-amber-400/70">
              ⚠️ Below 75% highlighted. Holidays excluded. Excel has second sheet with low-attendance list.
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ SETTINGS ══════════════ */}
      {instituteTab === 'settings' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
            <h3 className="text-white font-bold text-sm border-b border-white/10 pb-3">🏫 Institute Details</h3>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Institute Name</label>
              <input type="text" value={settingsForm.institute_name} onChange={e => setSettingsForm(p => ({ ...p, institute_name: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Primary WhatsApp</label>
                <input type="text" value={settingsForm.primary_admin_phone} onChange={e => setSettingsForm(p => ({ ...p, primary_admin_phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Secondary WhatsApp</label>
                <input type="text" value={settingsForm.secondary_admin_phone} onChange={e => setSettingsForm(p => ({ ...p, secondary_admin_phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
            <h3 className="text-white font-bold text-sm border-b border-white/10 pb-3">💬 Message Templates</h3>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                Absence Template <span className="ml-2 text-indigo-400 font-normal">Placeholders: {'{name}'} {'{date}'} {'{course}'} {'{institute}'}</span>
              </label>
              <textarea rows={3} value={settingsForm.absence_template} onChange={e => setSettingsForm(p => ({ ...p, absence_template: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                Fee Reminder Template <span className="ml-2 text-indigo-400 font-normal">Placeholders: {'{name}'} {'{course}'} {'{institute}'}</span>
              </label>
              <textarea rows={3} value={settingsForm.fee_template} onChange={e => setSettingsForm(p => ({ ...p, fee_template: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <button onClick={saveSettings} disabled={savingSettings}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
            {savingSettings ? 'Saving...' : settingsSaved ? '✅ Saved!' : '💾 Save Settings'}
          </button>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-bold text-sm border-b border-white/10 pb-3">🗄️ Backup & Restore</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={exportBackup} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-all">
                📥 Export Backup (JSON)
              </button>
              <label className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold px-5 py-2.5 rounded-lg text-sm cursor-pointer text-center transition-all">
                📤 Import Backup
                <input type="file" accept=".json" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    try {
                      const p = JSON.parse(ev.target?.result as string);
                      if (p.instStudents) setInstStudents(p.instStudents);
                      if (p.attendanceLogs) setAttendanceLogs(p.attendanceLogs);
                      if (p.holidays) setHolidays(p.holidays);
                      if (p.settings) { setSettings(p.settings); setSettingsForm(p.settings); }
                      alert('✅ Backup restored. Re-save to sync Supabase.');
                    } catch { alert('❌ Invalid backup file.'); }
                  };
                  reader.readAsText(f);
                }} />
              </label>
            </div>
            <p className="text-slate-500 text-xs">Export = full JSON snapshot. Import restores local view.</p>
          </div>
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN ADMIN PANEL
// ─────────────────────────────────────────────
function AdminPanelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<'students' | 'passages' | 'institute'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [selectedStudentTests, setSelectedStudentTests] = useState<TestResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'tamil'>('english');
  const [level, setLevel] = useState<'junior' | 'senior'>('junior');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loadingPassages, setLoadingPassages] = useState(true);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [allTestResults, setAllTestResults] = useState<TestResult[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, TestMetrics>>({});
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'passages') setActiveTab('passages');
    else if (tabParam === 'institute') setActiveTab('institute');
    else setActiveTab('students');
  }, [searchParams]);

  useEffect(() => {
    if (loading === false && isAdmin === false) router.push('/dashboard');
  }, [isAdmin, loading, router]);

  const fetchPassages = async () => {
    try {
      setLoadingPassages(true);
      const { data, error: fetchError } = await supabase.from('passages').select('id, text, language, level, created_at').order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setPassages((data as Passage[]) || []);
    } catch (err) { console.error('Error loading passages:', err); }
    finally { setLoadingPassages(false); }
  };

  const fetchStudentTelemetry = async () => {
    try {
      setLoadingStudents(true);
      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false });
      if (profilesError) throw profilesError;
      const typedProfiles = (profilesData as StudentProfile[]) || [];
      setStudents(typedProfiles);
      const { data: testsData, error: testsError } = await supabase.from('test_results').select('user_id, wpm, accuracy, created_at').order('created_at', { ascending: true });
      if (testsError) throw testsError;
      const typedTests = (testsData as TestResult[]) || [];
      setAllTestResults(typedTests);
      const userAggregates: Record<string, { sumWpm: number; sumAcc: number; count: number }> = {};
      typedTests.forEach(test => {
        if (!test.user_id || test.wpm <= 0) return;
        if (!userAggregates[test.user_id]) userAggregates[test.user_id] = { sumWpm: 0, sumAcc: 0, count: 0 };
        userAggregates[test.user_id].sumWpm += test.wpm;
        userAggregates[test.user_id].sumAcc += test.accuracy;
        userAggregates[test.user_id].count += 1;
      });
      const finalMap: Record<string, TestMetrics> = {};
      typedProfiles.forEach(profile => {
        if (!profile.id) return;
        const stats = userAggregates[profile.id];
        finalMap[profile.id] = {
          total_tests: stats ? stats.count : 0,
          avg_wpm: stats && stats.count > 0 ? Math.round(stats.sumWpm / stats.count) : 0,
          avg_accuracy: stats && stats.count > 0 ? Math.round(stats.sumAcc / stats.count) : 0,
        };
      });
      setMetricsMap(finalMap);
    } catch (err) { console.error('Error loading student metrics:', err); }
    finally { setLoadingStudents(false); }
  };

  useEffect(() => {
    if (loading === false && isAdmin === true) { fetchPassages(); fetchStudentTelemetry(); }
  }, [isAdmin, loading]);

  const handleSelectStudent = (student: StudentProfile) => {
    setSelectedStudent(student);
    setSelectedStudentTests(allTestResults.filter(t => t.user_id === student.id && t.wpm > 0));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile); setError(null);
      if (!title) setTitle(selectedFile.name.replace('.pdf', ''));
    } else { setFile(null); setError('Please upload a valid PDF file.'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSuccess(null);
    if (!title || !file) { setError('Please provide a title and select a PDF file.'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('title', title);
      formData.append('language', language); formData.append('level', level);
      const response = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to parse PDF.');
      setSuccess('🎉 PDF parsed and saved!');
      setTitle(''); setFile(null); fetchPassages();
    } catch (err: any) { setError(err.message || 'Failed to upload PDF passage'); }
    finally { setUploading(false); }
  };

  const handleDeletePassage = async (passageId: string) => {
    if (!confirm('Delete this passage?')) return;
    try {
      const { error: deleteError } = await supabase.from('passages').delete().eq('id', passageId);
      if (deleteError) throw deleteError;
      setPassages(prev => prev.filter(p => p.id !== passageId));
    } catch (err) { alert('Failed to delete passage.'); }
  };

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
      <div className="text-xl text-slate-400 animate-pulse">Loading Admin Gate...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />
      <div className="relative z-10">
        <Navbar hideContact={true} />
        <div className="max-w-6xl mx-auto px-4 py-12">

          <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1 block">Lakshmi Technical Institute</span>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Administrative Dashboard</h1>
              <p className="text-slate-400 mt-1">Track student progress and upload evaluation passages</p>
            </div>
            <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/10 self-start gap-1">
              {([
                { id: 'students', label: '📊 Student Progress' },
                { id: 'passages', label: '📄 Manage Passages' },
                { id: 'institute', label: '🏫 Institute' },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'students' && (
            <div className="space-y-6">
              {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => { setSelectedStudent(null); setSelectedStudentTests([]); }} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">✖️</button>
                    <h3 className="text-2xl font-bold text-white mb-2">Performance Curve: {selectedStudent.full_name || 'Typist'}</h3>
                    <p className="text-sm text-slate-400 mb-6">Plotting chronological speeds (WPM) and accuracy fluctuations.</p>
                    {selectedStudentTests.length > 0 ? (
                      <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedStudentTests.map((t, idx) => ({ index: `Test ${idx + 1}`, wpm: t.wpm, accuracy: t.accuracy }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" />
                            <XAxis dataKey="index" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#818cf8' }} />
                            <Line type="monotone" dataKey="wpm" stroke="#818cf8" strokeWidth={3} name="Speed (WPM)" dot={{ fill: '#818cf8', r: 4 }} />
                            <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} name="Accuracy %" strokeDasharray="5 5" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 w-full flex items-center justify-center text-slate-500 border border-dashed border-white/5 rounded-xl">
                        This typist has not logged any valid evaluation results yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Live Learner Progress Audits</h2>
                    <p className="text-xs text-slate-400 mt-1">Click a student's row to open their graph!</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                      <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
                      <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button onClick={fetchStudentTelemetry} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white transition-all whitespace-nowrap">
                      🔄 Refresh Metrics
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Learner Profile</th>
                        <th className="px-6 py-4">Email Address</th>
                        <th className="px-6 py-4 text-center">Tests Completed</th>
                        <th className="px-6 py-4 text-center">Avg Speed</th>
                        <th className="px-6 py-4 text-center">Avg Accuracy</th>
                        <th className="px-6 py-4">Enrolled On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-white">
                      {loadingStudents ? (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-400 animate-pulse">Synchronizing student telemetry...</td></tr>
                      ) : filteredStudents.length > 0 ? filteredStudents.map(student => {
                        const metrics = metricsMap[student.id] || { total_tests: 0, avg_wpm: 0, avg_accuracy: 0 };
                        return (
                          <tr key={student.id} onClick={() => handleSelectStudent(student)} className="cursor-pointer transition-colors hover:bg-white/5">
                            <td className="px-6 py-4 font-semibold text-white">{student.full_name || 'Anonymous Typist'}</td>
                            <td className="px-6 py-4 text-slate-400">{student.email || 'n/a'}</td>
                            <td className="px-6 py-4 text-center font-bold text-indigo-400">{metrics.total_tests}</td>
                            <td className="px-6 py-4 text-center"><span className="font-extrabold text-white">{metrics.avg_wpm}</span> <span className="text-xs text-slate-400">WPM</span></td>
                            <td className="px-6 py-4 text-center font-bold text-emerald-400">{metrics.avg_accuracy}%</td>
                            <td className="px-6 py-4 text-slate-400">{new Date(student.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-500">No students found matching that search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'passages' && (
            <>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl mb-12">
                <h2 className="text-xl font-bold mb-6">Upload New PDF Syllabus</h2>
                {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">⚠️ {error}</div>}
                {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">✅ {success}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                      <select value={language} onChange={e => setLanguage(e.target.value as 'english' | 'tamil')} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                        <option value="english" className="bg-[#111827]">English</option>
                        <option value="tamil" className="bg-[#111827]">Tamil</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty Grade</label>
                      <select value={level} onChange={e => setLevel(e.target.value as 'junior' | 'senior')} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                        <option value="junior" className="bg-[#111827]">Junior (1500 Strokes)</option>
                        <option value="senior" className="bg-[#111827]">Senior (2250 Strokes)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Passage Title / Reference Number</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., English Junior Test Set 1" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">PDF File</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl px-6 py-10 flex flex-col items-center justify-center hover:bg-white/5 transition-colors cursor-pointer relative">
                      <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-white text-base font-semibold">{file ? file.name : 'Drag and drop your PDF here, or click to browse'}</p>
                    </div>
                  </div>
                  <button type="submit" disabled={uploading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
                    {uploading ? 'Parsing PDF Text...' : 'Add Passage 🚀'}
                  </button>
                </form>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Existing Database Passages</h2>
                  <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-md border border-emerald-500/30">Total Loaded: {passages.length}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Title Prefix</th>
                        <th className="px-6 py-4">Language</th>
                        <th className="px-6 py-4">Grade</th>
                        <th className="px-6 py-4">Created On</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-white">
                      {loadingPassages ? (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-400 animate-pulse">Syncing passages...</td></tr>
                      ) : passages.length > 0 ? passages.map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white truncate max-w-xs">{p.text.slice(0, 45)}...</td>
                          <td className="px-6 py-4 capitalize text-indigo-300">{p.language}</td>
                          <td className="px-6 py-4 capitalize text-emerald-400">{p.level}</td>
                          <td className="px-6 py-4 text-slate-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleDeletePassage(p.id)} className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all">Delete 🗑️</button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-500">No passages found. Add one above!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'institute' && <InstituteModule />}

        </div>
      </div>
    </div>
  );
}

export default function CombinedAdminPanel() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading Admin Gate...</div>
      </div>
    }>
      <AdminPanelContent />
    </Suspense>
  );
}
