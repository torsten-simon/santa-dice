import { ApplicationRef, Component, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {environment} from '../environments/environment';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private http: HttpClient, private ngZone: NgZone, private ref: ApplicationRef, private route: ActivatedRoute) {
    this.route.queryParams.subscribe((params) => {
      if (params.mode === 'topics') {
        this.label = 'Dein Themenvorschlag';
      } else {
        this.label = 'Dein Name';
      }
    });
    this.name = localStorage.getItem('name');
    setInterval(() => this.updateList(), 1000);
    this.updateList();
    this.renderSnow();

  }

  static API_URL = 'api.php';
  snowCount = 500;
  snow: any = [];
  adminName = environment.adminName;
  name: string;
  isAdded = false;
  dices: Dice[];
  isDicing = false;
  label = '';

  private renderSnow() {
    this.ngZone.runOutsideAngular(() => {
      while (this.snow.length < this.snowCount / 2) {
        this.snow.push({y: Math.random() * window.innerHeight, x: Math.random() * 100, size: Math.random() * 5 + 3,
          direction: Math.random() - 0.5, speed: Math.random() * 0.5 + 0.5});
      }
      setTimeout(() => {
        if (this.snow.length < this.snowCount && Math.random() < 0.5) {
          this.snow.push({y: -5, x: Math.random() * 100, size: Math.random() * 5 + 3,
            direction: Math.random() - 0.5, speed: Math.random() * 0.5 + 0.5});
        }
        const copy = [];
        for (const s of this.snow) {
          s.y += s.speed / 3;
          s.x += s.direction / 6;
          if (s.y < 105) {
            copy.push(s);
          }
        }
        this.snow = copy;
        this.ref.tick();
        this.renderSnow();
      }, 1000. / 60.);
    });
  }
  async updateList() {
    let newDices = await this.http.get<Dice[]>(AppComponent.API_URL).toPromise();
    if (this.isAdded) {
      let data = newDices?.filter((d) => d.name === this.name);
      if (this.isDicing) {
        data = this.dices.filter((d) => d.name === this.name);
      }
      newDices = data.concat(newDices.filter((d) => d.name !== this.name));
    }
    if (JSON.stringify(this.dices) !== JSON.stringify(newDices)) {
      this.dices = newDices;
    }


  }
  highest() {
    return this.dices?.reduce((d1, d2) => this.sum(d1.number) > this.sum(d2.number) ? d1 : d2);
  }
  async reset(mode: 'reset' | 'delete') {
    await this.http.get<Dice[]>(AppComponent.API_URL + '?action=' + mode).toPromise();
    if (mode === 'delete') {
      this.isAdded = false;
    }
    this.updateList();
  }
  async addName() {
    this.isAdded = true;
    if(this.name === this.adminName) {
      return;
    }
    localStorage.setItem('name', this.name);
    // only add if not in list
    if (!this.getMyDice()) {
      await this.http.get<Dice[]>(AppComponent.API_URL + '?action=put&name=' + this.name).toPromise();
      console.log('add');
    }
    this.updateList();
  }
  getMyDice() {
    return this.dices?.filter((d) => d.name === this.name)[0];
  }
  diceNumber() {
    // const oldNumber = this.getMyDice().number;
    // do{
    this.getMyDice().number = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
    // }while(this.getMyDice().number === oldNumber);
  }
  sum(numbers: number[]) {
    if (!numbers) {
      return 0;
    }
    return numbers?.reduce((a, b) => a + b);
  }
  startDice() {
    this.isDicing = true;
    const int = setInterval(() => this.diceNumber(), 200);
    this.diceNumber();
    setTimeout(async () => {
      clearInterval(int);
      await this.http.get<Dice[]>(AppComponent.API_URL + '?action=put&name=' + this.name + '&dice=true').toPromise();
      this.isDicing = false;
      this.updateList();
    }, 5000);
  }
}

export interface Dice {
  name: string;
  number: number[];
}
