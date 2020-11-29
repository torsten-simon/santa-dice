import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  static API_URL = 'http://127.0.0.1/dice/api.php';
  name: string;
  isAdded = false;
  dices: Dice[];
  isDicing = false;
  constructor(private http: HttpClient){
      this.name = localStorage.getItem("name");
      setInterval(() => this.updateList(), 20000);
      this.updateList();
  }
  async updateList() {
    const newDices = await this.http.get<Dice[]>(AppComponent.API_URL).toPromise();
    if(this.isAdded){
      let data = newDices?.filter((d) => d.name === this.name);
      if(this.isDicing) {
        data = this.dices.filter((d) => d.name === this.name)
      }
      this.dices = data.concat(newDices.filter((d) => d.name !== this.name));

    } else {
      this.dices = newDices;
    }

  }
  highest() {
    return this.dices?.reduce((d1,d2) => d1.number > d2.number ? d1 : d2);
  }
  async reset(mode: 'reset' | 'delete'){
    await this.http.get<Dice[]>(AppComponent.API_URL + '?action=' + mode).toPromise();
    this.updateList();
  }
  async addName(){
    this.isAdded = true;
    localStorage.setItem("name", this.name);
    // only add if not in list
    if(!this.getMyDice()){
      await this.http.get<Dice[]>(AppComponent.API_URL + '?action=put&name=' + this.name).toPromise();
      console.log("add");
    }
    this.updateList();
  }
  getMyDice(){
    return this.dices?.filter((d) => d.name === this.name)[0];
  }
  diceNumber(){
    const oldNumber = this.getMyDice().number;
    do{
      this.getMyDice().number = Math.floor(Math.random() * 6) + 1;
    }while(this.getMyDice().number === oldNumber);
  }
  startDice(){
    this.isDicing = true;
    const int = setInterval(() => this.diceNumber(), 200);
    this.diceNumber();
    setTimeout(async () => {
      clearInterval(int);
      this.isDicing = false;
      await this.http.get<Dice[]>(AppComponent.API_URL + '?action=put&name=' + this.name + '&number=' + this.getMyDice().number).toPromise();
      this.updateList();
    }, 5000);
  }
}

export interface Dice{
  name: string;
  number: number;
}