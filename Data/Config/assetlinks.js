//android app links verification
//will allow links to be redirected to the app instead of opening in a browser
const assetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.example.adaxintegra',
      sha256_cert_fingerprints: [
        //debug certificate
        '87:E4:E7:DC:7E:31:BC:A9:37:EF:0D:B6:0A:7E:42:56:FD:44:62:80:20:DF:04:2D:78:4C:15:94:2C:34:65:39',

        //release certificate
      ],
    },
  },
];

export default assetLinks;
