import { Chnagal } from './src/index';

const changal = new Chnagal();

changal.register([
  {
    name: 'ao',
    links: [
      'https://ahanonline.com/product-category/%D8%A7%D8%B3%D8%AA%D9%86%D9%84%D8%B3-%D8%A7%D8%B3%D8%AA%DB%8C%D9%84/%D9%86%D8%A8%D8%B4%DB%8C-%D9%88-%D9%86%D8%A7%D9%88%D8%AF%D8%A7%D9%86%DB%8C-%D8%A7%D8%B3%D8%AA%DB%8C%D9%84/',
    ],
    onSuccess: (data) => {
      console.log(data);
    },
  },
]);

changal.start();
