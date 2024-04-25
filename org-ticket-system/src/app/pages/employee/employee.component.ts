import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../../core/services/department.service';
import { CreateUpdateDeleteAPIResponseType, Department, EmployeeData, FindAllAPIResponseType } from '../../core/models/API.Model';
import { CommonModule } from '@angular/common';
import { NaPipe } from "../../shared/pipes/na.pipe";
import { EmployeeService } from './../../core/services/employee.service';
import { Observable, firstValueFrom } from 'rxjs';
import { Constant } from '../../core/constant/Constant';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [FormsModule, CommonModule, NaPipe],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent implements OnInit {

  userInputEmployeeId: number = 0;
  userInputEmployeeName: string = '';
  userSelectedDepartmentId: number = 0;
  userSelectedDepartmentName: string = '';
  userInputContactNo: number = 0;
  userSelectedRole: string = '';
  userInputEmailAddress: string = '';

  allDepartmentDetails: any;
  allEmployeeDetails: any;
  befEditEmpObj: any;
  aftEditEmpObj: any;

  employeeIdExists: boolean = false;
  contactNoError: boolean = false;
  emailError: boolean = false;
  departmentNameExists: boolean = false;
  departmentIdExists: boolean = false;
  editClicked: boolean = false;

  loggedInUser: any;


  constructor(private employeeService: EmployeeService, private deptService: DepartmentService) {
    // this.employeeObservable = this.employeeService.GetAllEmployeesArray();
    this.deptService.getAllDepartments().subscribe((response: FindAllAPIResponseType) => {
      if (response.status === 'success') {
        this.allDepartmentDetails = response.data;
      }
      else {
        alert("GetAllDepartment Service API Error: " + response.status);
      }
    })
  }

  ngOnInit(): void {
    const localStorageEmployeeData = localStorage.getItem('EmployeeData');
    if (localStorageEmployeeData != null) {
      this.loggedInUser = JSON.parse(localStorageEmployeeData);
      this.loggedInUser.role = this.loggedInUser.role.toUpperCase();
    }
    this.loadEmployees();
  }

  sortEmployeesData(data: any) {
    return data.sort((a: any, b: any) => {
      // Prioritize 'Admin' role above all
      if (a.role.toUpperCase() === "ADMIN" && b.role.toUpperCase() !== "ADMIN") {
        return -1;
      }
      if (a.role.toUpperCase() !== "ADMIN" && b.role.toUpperCase() === "ADMIN") {
        return 1;
      }

      // When roles are not 'Admin', sort alphabetically by department name
      if (a.deptName.toUpperCase() < b.deptName.toUpperCase()) {
        return -1;
      }
      if (a.deptName.toUpperCase() > b.deptName.toUpperCase()) {
        return 1;
      }

      // Within the same department, prioritize 'Department Head' over 'Employee'
      if (a.role.toUpperCase() === "DEPARTMENT HEAD" && b.role.toUpperCase() !== "DEPARTMENT HEAD") {
        return -1;
      }
      if (a.role.toUpperCase() !== "DEPARTMENT HEAD" && b.role.toUpperCase() === "DEPARTMENT HEAD") {
        return 1;
      }

      // If same department and same role or roles are neither 'Department Head' nor 'Admin'
      return 0;
    });

  }

  loadEmployees() {
    this.employeeService.GetAllEmployees().subscribe((response: FindAllAPIResponseType) => {
      this.allEmployeeDetails = this.sortEmployeesData(response.data);
    })
  }

  setDepartmentName() {
    if (this.userSelectedDepartmentId) {
      this.userSelectedDepartmentName = this.allDepartmentDetails.find((dept: any) => dept.deptId === +this.userSelectedDepartmentId).deptName.toUpperCase();
      console.log(this.userSelectedDepartmentName)
    }
  }

  resetFormData() {
    this.userInputEmployeeId = 0
    this.userInputEmployeeName = '';
    this.userSelectedDepartmentId = 0;
    this.userInputContactNo = 0;
    this.userSelectedRole = '';
    this.userInputEmailAddress = '';
    this.editClicked = false;
    this.employeeIdExists = false;
    this.contactNoError = false;
    this.emailError = false;
  }

  checkEmployeeId() {
    if (this.userInputEmployeeId > 0 && this.userInputEmployeeId < 1000000) {
      if (this.editClicked) {
        const temp = this.allEmployeeDetails.filter((emp: any) => emp.employeeId !== this.befEditEmpObj.employeeId);
        this.employeeIdExists = temp.some((emp: any) => emp.employeeId == this.userInputEmployeeId)
      }
      else {
        this.employeeIdExists = this.allEmployeeDetails.some((emp: any) => emp.employeeId == this.userInputEmployeeId)
      }
    }
    else {
      this.employeeIdExists = true;
    }
  }

  checkContactNo() {
    if (this.userInputContactNo <= 999999999 || this.userInputContactNo > 9999999999) {
      this.contactNoError = true;
    }
    else {
      this.contactNoError = false;
    }
  }

  checkEmail() {
    const regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
    if (regex.test(this.userInputEmailAddress)) {
      if (this.editClicked) {
        const temp = this.allEmployeeDetails.filter((emp: any) => emp.emailId.toLowerCase() !== this.befEditEmpObj.emailId.toLowerCase());
        this.emailError = temp.some((emp: any) => emp.emailId.toLowerCase() === this.userInputEmailAddress.toLowerCase())
      }
      else {
        this.emailError = this.allEmployeeDetails.some((emp: any) => emp.emailId.toLowerCase() === this.userInputEmailAddress.toLowerCase())
      }
    }
    else {
      this.emailError = true;
    }
  }

  checkAllRequiredFields() {
    if (this.userInputEmployeeId == 0 || this.userInputEmployeeName === "" || this.userSelectedDepartmentId == 0 ||
      this.userInputContactNo == 0 || this.userSelectedRole === "" || this.userInputEmailAddress === ""
    ) {
      return false;
    }
    else {
      return true;
    }
  }

  async createEmployeeAPICall(user: any) {
    const responseCreateUser = await firstValueFrom(this.employeeService.createEmployee(user));
    if (responseCreateUser.status == 'success') {
      console.log("Employee Created Successfully");
    }else{
      alert("Create Employee API call failed in employee component.");
    }
  }

  async updateEmployeeAPICall(employee:any){
    const responseUpdateUser = await firstValueFrom(this.employeeService.updateEmployeeDetails(employee._id, employee));
    if (responseUpdateUser.status == 'success') {
        console.log("Employee Updated Successfully");
    }else{
      alert("Update Employee API call failed in employee component.");
    }
  }

  async deleteEmployeeAPICall(employee:any){
    const responseUpdateUser = await firstValueFrom(this.employeeService.deleteEmployee(employee._id));
    if (responseUpdateUser.status == 'success') {
        console.log("Employee Deleted Successfully");
    }else{
      alert("Delete Employee API call failed in employee component.");
    }
  }

  async updateDeptAPICall(dept:any){
    const responseUpdateDept = await firstValueFrom(this.deptService.updateDepartment(dept._id, dept));
    if (responseUpdateDept.status == 'success') {
        console.log("Dept Updated Successfully");
    }
    else{
      alert("Update Department API call failed in employee component.");
    }
  }

  async onSaveClick() {
    if (this.checkAllRequiredFields()) {
      //fetch selected department details (from the department list)
      const selectedDeptDetails = this.allDepartmentDetails.find((dept: any) => dept.deptId == this.userSelectedDepartmentId);
      const toCreateEmp = {
        employeeId: this.userInputEmployeeId.toString(),
        employeeName: this.userInputEmployeeName,
        deptId: this.userSelectedDepartmentId.toString(),
        deptName: selectedDeptDetails.deptName,
        contactNo: this.userInputContactNo.toString(),
        emailId: this.userInputEmailAddress,
        password: Constant.DEFAULT_PASSWORD,
        role: this.userSelectedRole
      }
      console.log(toCreateEmp);
      if (this.userSelectedRole.toUpperCase() === 'EMPLOYEE' || this.userSelectedRole.toUpperCase() === 'ADMIN') {
        await this.createEmployeeAPICall(toCreateEmp);
      }
      else {
        if (selectedDeptDetails.deptHeadEmpId == 0) {
          await this.createEmployeeAPICall(toCreateEmp);
          selectedDeptDetails.deptHeadEmpId = + toCreateEmp.employeeId;
          selectedDeptDetails.deptHeadName = toCreateEmp.employeeName;
          await this.updateDeptAPICall(selectedDeptDetails);
        }
        else {
          const prevDeptHeadEmployee = this.allEmployeeDetails.find((emp: any) => emp.employeeId == selectedDeptDetails.deptHeadEmpId.toString());
          prevDeptHeadEmployee.role = 'EMPLOYEE';
          await this.updateEmployeeAPICall(prevDeptHeadEmployee);
          await this.createEmployeeAPICall(toCreateEmp);
          selectedDeptDetails.deptHeadEmpId = + toCreateEmp.employeeId;
          selectedDeptDetails.deptHeadName = toCreateEmp.employeeName;
          await this.updateDeptAPICall(selectedDeptDetails);
        }
      }
      this.resetFormData();
      this.loadEmployees();
    }
    else {
      alert('All Fields are required. Please fill up all details.');
      return;
    }
  }

  async onUpdateClick() {
    // console.log(this.befEditEmpObj);
    // const oldHeadInMoreDept = this.allDepartmentDetails.filter((dept: any) => dept.deptHeadEmpId === this.befEditEmpObj.deptHeadEmpId);
    // const oldUserDetails = this.allEmployeeDetails.find((employee: any) => employee.employeeId === (this.befEditEmpObj.deptHeadEmpId).toString());
    // const newUserDetails = this.allEmployeeDetails.find((employee: any) => employee.employeeId === (this.userInputDepartmentHeadId).toString());
    // console.log("oldUserDetails: ", oldUserDetails);
    // console.log("newUserDetails: ", newUserDetails);
    // if (oldUserDetails !== newUserDetails) {
    //       if (oldHeadInMoreDept.length == 1) {
    //             console.log('user details: ', oldUserDetails);
    //             if (oldUserDetails.role !== "Admin") {
    //               oldUserDetails.role = "Employee";
    //             }
    //             // oldUserDetails.deptId = "";
    //             // oldUserDetails.deptName = "";
    //             // this.employeeService.updateEmployeeDetails(oldUserDetails._id, oldUserDetails).subscribe((response: CreateUpdateDeleteAPIResponseType) => {
    //             //   if (response.status !== 'success') { alert("updateEmployeeDetails Service API Error: " + response.message); }
    //             //   else { console.log("User Updated Successfully"); }
    //             // });
    //             const responseOldUser = await firstValueFrom(this.employeeService.updateEmployeeDetails(oldUserDetails._id, oldUserDetails));
    //             if (responseOldUser.status !== 'success') {
    //               console.log("Old User Updated Successfully");
    //             }

    //       }

    //       newUserDetails.role = 'Department Head';
    //       // newUserDetails.deptId = this.userInputDepartmentId.toString();
    //       // newUserDetails.deptName = this.userInputDepartmentName;
    //       this.employeeService.updateEmployeeDetails(newUserDetails._id, newUserDetails).subscribe((response: CreateUpdateDeleteAPIResponseType) => {
    //         if (response.status !== 'success') { alert("updateEmployeeDetails Service API Error: " + response.message); }
    //         else { console.log("User Updated Successfully"); }
    //       });
    // }

    // const updateDepartment = {
    //       deptId: this.userInputDepartmentId,
    //       deptName: this.userInputDepartmentName,
    //       deptHeadEmpId: +newUserDetails.employeeId,
    //       deptHeadName: newUserDetails.employeeName,
    //       createdDate: this.befEditEmpObj ? this.befEditEmpObj.createdDate : new Date()
    // }
    // this.deptService.updateDepartment(this.befEditEmpObj._id, updateDepartment).subscribe((response: CreateUpdateDeleteAPIResponseType) => {
    //       if (response.status !== 'success') { alert("updateDepartmentDetails Service API Error: " + response.message); }
    //       else { console.log("Department Updated Successfully"); this.loadEmployees(); }
    // });
    // this.resetFormData();
  }

  onEditClicked(empObj: any) {
    //Setting up the Edit Form
    this.editClicked = true;
    this.befEditEmpObj = empObj;
    this.userInputEmployeeId = empObj.employeeId;
    this.userInputEmployeeName = empObj.employeeName;
    this.userSelectedDepartmentId = empObj.deptId;
    this.userInputContactNo = empObj.contactNo;
    this.userSelectedRole = empObj.role.toUpperCase();
    this.userInputEmailAddress = empObj.emailId;

    this.userSelectedDepartmentName = this.allDepartmentDetails.find((dept: any) => dept.deptId === +this.userSelectedDepartmentId).deptName.toUpperCase();
    console.log(this.userSelectedDepartmentName)

  }

  async onDeleteClicked(empObj: any) {
    const toDelEmp = empObj;
    //Delete Selected Employee
    await this.deleteEmployeeAPICall(toDelEmp);
    //Update Department Details if Deleted Employee found in Department Data
    if(toDelEmp.role.toUpperCase() === "DEPARTMENT HEAD"){
      const toUpdateDept = this.allDepartmentDetails.find((dept:any) => dept.deptId.toString() == toDelEmp.deptId)
      console.log("toUpdateDept: ",toUpdateDept);
      toUpdateDept.deptHeadEmpId = 0;
      toUpdateDept.deptHeadName = '';
      await this.updateDeptAPICall(toUpdateDept);
    }
    if(toDelEmp.role.toUpperCase() === "Admin"){
      const adminDept = this.allDepartmentDetails.find((dept:any) => dept.deptId.toString() == toDelEmp.deptId)
      if(adminDept.deptHeadEmpId.toString() == toDelEmp.employeeId){
        adminDept.deptHeadEmpId = 0;
        adminDept.deptHeadName = "";
        await this.updateDeptAPICall(adminDept);
      }
    }
    this.loadEmployees();
    this.resetFormData();
  }

}




