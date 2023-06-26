import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Time } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import * as XLSX from 'xlsx';
import {Inject} from '@angular/core';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

export interface User {
  userID: string,
  userName: string,
  date: Date,
  punchIn: Time,
  punchOut: Time,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'Keyence-technical-test-frontend';
  data : User[] = [];
  headers= new HttpHeaders()
  .set('content-type', 'application/json')
  .set('Access-Control-Allow-Origin', '*');
  displayedColumns: string[] = ['userID', 'userName', 'date', 'punchIn', 'punchOut', 'actions'];
  excelData: any[] = [];

  constructor (
    private http: HttpClient,
    public dialog: MatDialog
  ) {}

  ngOnInit(){
    this.http.get('http://localhost:3000/findAll',{ 'headers': this.headers })
    .subscribe((data: any) => {
      this.data = data;
    })
  }

  readExcel(event: any) {
    if(event){
      let file = event.target.files[0];
      let fileReader = new FileReader();
      // let blob = new Blob([new Uint8Array(event.target.files[0])], {type: file.type });
      fileReader.readAsBinaryString(file);
      fileReader.onload = (e) =>{
        var workbook = XLSX.read(fileReader.result,{type:'binary'});
        var sheetNames = workbook.SheetNames;
        this.excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
        console.log(this.excelData);
        if(this.excelData){
          // for(let i=0;i<this.excelData.length;i++){
          //   console.log(this.excelData[i]["User Name"]);
          // }
          this.excelData.forEach((element) => {
            this.http.post<any>(`http://localhost:3000/insertUser`,{
              userID: element["User ID"],
              userName: element["User Name"],
              date: element["Date"],
              punchIn: element["Punch In"],
              punchOut: element["Punch Out"]
            },{ 'headers': this.headers })
            .subscribe({
              next: data => {
                  console.log(data);
              },
              error: error => {
                  if(error.status == 200) {
                    console.log(error.error.text);
                    this.refresh();
                  } else { 
                    console.error('There was an error!', error);
                  }
              }
            });
          });
        }        
      }
    }
  }

  onUpdate(event: Event, eventData: User, rowIndex: number){
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: eventData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        let userUpdated: User = result;
        this.http.put<any>(`http://localhost:3000/updateUser/${userUpdated.userID}`,{
          userID: userUpdated.userID,
          userName: userUpdated.userName,
          date: userUpdated.date,
          punchIn: userUpdated.punchIn,
          punchOut: userUpdated.punchOut
        },{ 'headers': this.headers })
        .subscribe({
          next: data => {
              console.log(data);
          },
          error: error => {
              if(error.status == 200) {
                console.log(error.error.text);
                this.refresh();
              } else { 
                console.error('There was an error!', error);
              }
          }
        });
      }
    });
  }

  onDelete(event: Event, eventData: User, rowIndex: number){
    this.http.delete(`http://localhost:3000/deleteUser/${eventData.userID}`,{ 'headers': this.headers })
    .subscribe({
      next: data => {
          console.log(data);
      },
      error: error => {
          if(error.status == 200) {
            console.log(error.error.text);
            this.refresh();
          } else { 
            console.error('There was an error!', error);
          }
      }
    });
  }

  refresh(): void {
    this.http.get('http://localhost:3000/findAll',{ 'headers': this.headers })
    .subscribe((data: any) => {
      this.data = data;
    })
  }
}

@Component({
  selector: 'editDialog',
  templateUrl: 'editDialog.html',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
})
export class DialogOverviewExampleDialog {
  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: User,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
