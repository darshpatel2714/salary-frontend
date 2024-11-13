import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './SalaryForm.css';

const SalaryForm = () => {
    const [salaryData, setSalaryData] = useState({
        salaryRate: '',
        inTime: '',
        outTime: '',
        regularHours: '',
        overtimeHours: '',
    });
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [salaryTableData, setSalaryTableData] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    // Constants for additional adjustments
    const PETROL_AMOUNT = 500;
    const OTHER_AMOUNT = 8335;
    const PTAX_AMOUNT = 200;

    useEffect(() => {
        const fetchSalaryData = async () => {
            try {
                const response = await axios.get(`mongodb+srv://pateldarsh456:darsh2712004@salary.sqe3h.mongodb.net/?retryWrites=true&w=majority&appName=Salary
/api/salary/${selectedYear}/${selectedMonth}`);
                setSalaryTableData(response.data);
            } catch (error) {
                console.error("Error fetching salary data:", error);
            }
        };
        fetchSalaryData();
    }, [selectedMonth, selectedYear]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSalaryData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        const regularHoursAmount = parseFloat(salaryData.salaryRate);
        const overtimeAmount = (regularHoursAmount / salaryData.regularHours) * salaryData.overtimeHours;
        const totalAmount = regularHoursAmount + overtimeAmount;
        const pf = regularHoursAmount * 0.12;
        const totalSalary = totalAmount - pf;

        try {
            const response = await axios.post('mongodb+srv://pateldarsh456:darsh2712004@salary.sqe3h.mongodb.net/?retryWrites=true&w=majority&appName=Salary
/api/salary', {
                ...salaryData,
                regularHoursAmount,
                overtimeHoursAmount: overtimeAmount,
                totalAmount,
                pf,
                totalSalary,
            });
            setSalaryTableData([...salaryTableData, response.data]);
        } catch (error) {
            if (error.response && error.response.data.message) {
                setErrorMessage(error.response.data.message);
            } else {
                console.error(error);
            }
        }
    };

    // Calculate totals for each column
    const totals = salaryTableData.reduce((acc, entry) => {
        acc.regularHours += entry.regularHours || 0;
        acc.overtimeHours += entry.overtimeHours || 0;
        acc.regularHoursAmount += entry.regularHoursAmount || 0;
        acc.overtimeHoursAmount += entry.overtimeHoursAmount || 0;
        acc.totalAmount += entry.totalAmount || 0;
        acc.pf += entry.pf || 0;
        acc.totalSalary += entry.totalSalary || 0;
        return acc;
    }, {
        regularHours: 0,
        overtimeHours: 0,
        regularHoursAmount: 0,
        overtimeHoursAmount: 0,
        totalAmount: 0,
        pf: 0,
        totalSalary: 0,
    });

    // Calculate final total with adjustments
    const finalTotal = totals.totalSalary + PETROL_AMOUNT + OTHER_AMOUNT - PTAX_AMOUNT;

    // Function to generate and download the PDF
    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Salary Statement for ${selectedMonth}-${selectedYear}`, 14, 10 );

        doc.autoTable({
            startY: 20,
            head: [['Date', 'Salary Rate', 'In Time', 'Out Time', 'Regular Hours', 'Overtime Hours', 'Regular Amount', 'Overtime Amount', 'Total Amount', 'PF', 'Total Salary']],
            body: salaryTableData.map((entry) => [
                new Date(entry.date).toLocaleDateString(),
                entry.salaryRate,
                entry.inTime,
                entry.outTime,
                entry.regularHours,
                entry.overtimeHours,
                entry.regularHoursAmount.toFixed(2),
                entry.overtimeHoursAmount.toFixed(2),
                entry.totalAmount.toFixed(2),
                entry.pf.toFixed(2),
                entry.totalSalary.toFixed(2)
            ]),
            foot: [
                [
                    'Totals', '', '', '', 
                    totals.regularHours, 
                    totals.overtimeHours, 
                    totals.regularHoursAmount.toFixed(2), 
                    totals.overtimeHoursAmount.toFixed(2), 
                    totals.totalAmount.toFixed(2), 
                    totals.pf.toFixed(2), 
                    totals.totalSalary.toFixed(2)
                ],
                [
                    'Additions:', '', '', '', '', '', '', '', '', 'Petrol', '500'
                ],
                [
                    '', '', '', '', '', '', '', '', '', 'Other', '8335'
                ],
                [
                    'Deductions:', '', '', '', '', '', '', '', '', 'P.Tax', '200'
                ],
                [
                    'Final Total', '', '', '', '', '', '', '', '', '', finalTotal.toFixed(2)
                ]
              
            ],
            theme: 'grid',
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fillColor: [255, 0, 0] },
        });
        
        doc.save(`Salary_Statement_${selectedMonth}-${selectedYear}.pdf`);
       
    };
    
    return (
        <div className="salary-container">
            <h2 className="title">Salary Form</h2>
            <form onSubmit={handleSubmit} className="salary-form">
                <input type="number" name="salaryRate" placeholder="Salary Rate" onChange={handleChange} required />
                <input type="text" name="inTime" placeholder="In Time" onChange={handleChange} required />
                <input type="text" name="outTime" placeholder="Out Time" onChange={handleChange} required />
                <input type="number" name="regularHours" placeholder="Regular Hours" onChange={handleChange} required />
                <input type="number" name="overtimeHours" placeholder="Overtime Hours" onChange={handleChange} />
                <button type="submit" className="submit-btn">Calculate Salary</button>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
            </form>

            <div className="month-selector">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                    {[...Array(12).keys()].map((month) => (
                        <option key={month + 1} value={month + 1}>{month + 1}</option>
                    ))}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                    {[...Array(5).keys()].map((i) => (
                        <option key={i} value={2023 + i}>{2023 + i}</option>
                    ))}
                </select>
            </div>

            <h2 className="title">{`Salary Table for ${selectedMonth}-${selectedYear}`}</h2>

            <table className="salary-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Salary Rate</th>
                        <th>In Time</th>
                        <th>Out Time</th>
                        <th>Regular Hours</th>
                        <th>Overtime Hours</th>
                        <th>Regular Amount</th>
                        <th>Overtime Amount</th>
                        <th>Total Amount</th>
                        <th>PF</th>
                        <th>Total Salary</th>
                    </tr>
                </thead>
                <tbody>
                    {salaryTableData.map((entry) => (
                        <tr key={entry.date}>
                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                            <td>{entry.salaryRate}</td>
                            <td>{entry.inTime}</td>
                            <td>{entry.outTime}</td>
                            <td>{entry.regularHours}</td>
                            <td>{entry.overtimeHours}</td>
                            <td>{entry.regularHoursAmount.toFixed(2)}</td>
                            <td>{entry.overtimeHoursAmount.toFixed(2)}</td>
                            <td>{entry.totalAmount.toFixed(2)}</td>
                            <td>{entry.pf.toFixed(2)}</td>
                            <td>{entry.totalSalary.toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="totals-row">
                        <td colSpan="4" style={{ fontWeight: "bold" }}>Totals</td>
                        <td style={{ fontWeight: "bold" }}>{totals.regularHours}</td>
                        <td style={{ fontWeight: "bold" }}>{totals.overtimeHours}</td>
                        <td style={{ fontWeight: "bold" }}>{totals.regularHoursAmount.toFixed(2)}</td>
                        <td style={{ fontWeight: "bold" }}>{totals.overtimeHoursAmount.toFixed(2)}</td>
                        <td style={{ fontWeight: "bold" }}>{totals.totalAmount.toFixed(2)}</td>
                        <td style={{ fontWeight: "bold" }}>{totals.pf.toFixed(2)}</td>
                        <td style={{ fontWeight: "bold" }}>{totals.totalSalary.toFixed(2)}</td>
                    </tr>
                    <tr className="totals-row">
                        <td colSpan="9" style={{ fontWeight: "bold" }}>Additions:<br></br> Petrol -500₹, <br></br>Other -8335₹</td>
                        <td colSpan="2" style={{ fontWeight: "bold" }}>Deductions:<br></br> P.Tax -200₹</td>
                    </tr>
                    <tr className="totals-row">
                        <td colSpan="9" style={{ fontWeight: "bold" }}>Final Total</td>
                        <td colSpan="2" style={{ fontWeight: "bold" }}>₹{finalTotal.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            <center><button onClick={downloadPDF} className="download-btn">Download PDF</button></center>
            <marquee><p>All rights reserved &#xA9; 2024 Darsh Patel.</p></marquee>
        </div>
    );
    
};


export default SalaryForm;
