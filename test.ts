import { Chnagal } from './src/index';

const changal = new Chnagal();

changal.addJob([
  {
    name: 'ao',
    url: 'https://pgco.info/industrial-galvanized-cold-pipe/',
    onSuccess: (data) => {
      console.log(JSON.stringify(data.data, null, 2));
    },
  },
  {
    name: 'doctop',
    url: 'https://pgco.info/industrial-galvanized-cold-pipe/',
    onSuccess: (data) => {
      console.log(JSON.stringify(data.data, null, 2));
    },
  },
]);

changal.start();
