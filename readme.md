A library to generate a mark down files documentation from joi file. The output will be in md format.

Usage:
Define your joi validator class

You can install the package globally or just include them in the scripts in the package.json
```
"apidocs": "astro-markdown-generator -v ./src -o ./docs"
```
```
-s is the source path of validators
-o is the location of the markdown file will be generated
-d if you are running deprecated version of joi
```

Example for multiple validator file
```
const Joi = require('joi')
const JoiPhone = Joi.extend(require('joi-phone-number'))

module.exports =  {
    name: 'login',
    description: 'Login API',
    path: '/login',
    type: 'post',
    deprecated: false,
    cors: true,
    enableApiGatewayCaching: true,
    cacheSchema: {
      query: ['id', 'packageAsset'],
      params: ['detailId'],
      headers: ['auth']
    }
    JoiSchema: {
      query: Joi.object({
        id: Joi.string(),
        packageAsset: Joi.string()
      }).xor('id', 'packageAsset'),
      body: Joi.object({
        fname: Joi.string().required()
      }),
      params: Joi.object({
        detailId: Joi.string().required()
      }),
      headers: Joi.object({
        auth: Joi.string().required()
      }),
      response: {
          200: {
              description: "successfully login",
              header: Joi.object().keys({
                          Authorization: Joi.string().required()
                      }),
              body: Joi.object().keys({
                  resultMessage: Joi.string().required(),
                  resultDescription: Joi.string().required(),
                  body: Joi.object().keys({
                      accessToken: Joi.string().required(),
                      refreshToken: Joi.string().required()
                  })
              })
          },
          400: {
              description: "invalid request body",
              body: Joi.object().keys({
                  resultMessage: Joi.string().required(),
                  resultDescription: Joi.string().required()
              })
          },
          401: {
              description: "invalid credential",
              body: Joi.object().keys({
                  resultMessage: Joi.string().required(),
                  resultDescription: Joi.string().required()
              })
          }
      }
  }
}
```